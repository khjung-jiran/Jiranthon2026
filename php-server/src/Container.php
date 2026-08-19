<?php

declare(strict_types=1);

namespace Eum;

use Eum\Controller\AlbumController;
use Eum\Controller\CalendarController;
use Eum\Controller\CapsuleController;
use Eum\Controller\DbViewerController;
use Eum\Controller\FamilyController;
use Eum\Controller\MediaController;
use Eum\Controller\NotificationController;
use Eum\Controller\PollController;
use Eum\Controller\QuestionController;
use Eum\Controller\ResponseController;
use Eum\Controller\SettingsController;
use Eum\Controller\StorybookController;
use Eum\Controller\UploadController;
use Eum\Controller\ViewController;
use Eum\Controller\VoiceController;
use Eum\Database\Connection;
use Eum\Http\ErrorHandler;
use Eum\Repository\CalendarRepository;
use Eum\Repository\CapsuleRepository;
use Eum\Repository\FamilyRepository;
use Eum\Repository\MemberRepository;
use Eum\Repository\NotificationRepository;
use Eum\Repository\PhotoRepository;
use Eum\Repository\PollRepository;
use Eum\Repository\QuestionRepository;
use Eum\Repository\ResponseRepository;
use Eum\Repository\SettingsRepository;
use Eum\Repository\StoryRepository;
use Eum\Service\AuthService;
use Eum\Service\EraClassifier;
use Eum\Service\FileUploadService;
use Eum\Service\FcmService;
use Eum\Service\FollowUpService;
use Eum\Service\NotificationService;
use Eum\Service\PasswordHasher;
use Eum\Service\ProcessRunner;
use Eum\Service\QuestionService;
use Eum\Service\SpeechService;
use Eum\Service\StoryGenerator;
use Eum\Service\StoryQualityEvaluator;
use Eum\Service\StorybookService;
use Eum\Support\Clock;
use Eum\Support\Logger;
use Eum\Support\Paths;
use Psr\Http\Message\ResponseFactoryInterface;
use Slim\Views\Twig;

/**
 * 의존성 조립.
 *
 * 리플렉션을 쓰지 않는다. 각 서비스가 무엇을 필요로 하는지 코드에 그대로
 * 드러나서, 잘못된 배선은 정적 분석과 IDE 가 바로 잡아낸다.
 *
 * 모든 접근자는 지연 생성 후 재사용한다 (요청당 1개).
 */
final class Container
{
    /** @var array<string, object> */
    private array $instances = [];

    public function __construct(
        private readonly ResponseFactoryInterface $responseFactory,
        private readonly bool $debug = false,
    ) {
    }

    // ── 기반 ──

    public function db(): \PDO
    {
        return $this->once(\PDO::class, static fn (): \PDO => Connection::open());
    }

    public function clock(): Clock
    {
        return $this->once(Clock::class, static fn (): Clock => new Clock());
    }

    public function logger(): Logger
    {
        return $this->once(Logger::class, static fn (): Logger => Logger::default());
    }

    public function twig(): Twig
    {
        return $this->once(Twig::class, fn (): Twig => Twig::create(Paths::templates(), [
            // 개발 편의를 위해 캐시를 끈다. 운영에서는 debug=false 로 캐시를 켠다.
            'cache' => $this->debug ? false : Paths::twigCache(),
            'debug' => $this->debug,
            'auto_reload' => $this->debug,
        ]));
    }

    public function errorHandler(): ErrorHandler
    {
        return $this->once(
            ErrorHandler::class,
            fn (): ErrorHandler => new ErrorHandler($this->responseFactory, $this->logger(), $this->debug)
        );
    }

    // ── 리포지토리 ──

    public function families(): FamilyRepository
    {
        return $this->once(
            FamilyRepository::class,
            fn (): FamilyRepository => new FamilyRepository($this->db(), $this->clock())
        );
    }

    public function members(): MemberRepository
    {
        return $this->once(
            MemberRepository::class,
            fn (): MemberRepository => new MemberRepository($this->db(), $this->clock())
        );
    }

    public function questions(): QuestionRepository
    {
        return $this->once(
            QuestionRepository::class,
            fn (): QuestionRepository => new QuestionRepository($this->db(), $this->clock())
        );
    }

    public function responses(): ResponseRepository
    {
        return $this->once(
            ResponseRepository::class,
            fn (): ResponseRepository => new ResponseRepository($this->db(), $this->clock())
        );
    }

    public function stories(): StoryRepository
    {
        return $this->once(
            StoryRepository::class,
            fn (): StoryRepository => new StoryRepository($this->db(), $this->clock())
        );
    }

    public function capsules(): CapsuleRepository
    {
        return $this->once(
            CapsuleRepository::class,
            fn (): CapsuleRepository => new CapsuleRepository($this->db(), $this->clock())
        );
    }

    public function calendar(): CalendarRepository
    {
        return $this->once(
            CalendarRepository::class,
            fn (): CalendarRepository => new CalendarRepository($this->db(), $this->clock())
        );
    }

    public function photos(): PhotoRepository
    {
        return $this->once(
            PhotoRepository::class,
            fn (): PhotoRepository => new PhotoRepository($this->db(), $this->clock())
        );
    }

    public function notifications(): NotificationRepository
    {
        return $this->once(
            NotificationRepository::class,
            fn (): NotificationRepository => new NotificationRepository($this->db(), $this->clock())
        );
    }

    public function polls(): PollRepository
    {
        return $this->once(
            PollRepository::class,
            fn (): PollRepository => new PollRepository($this->db(), $this->clock())
        );
    }

    public function settings(): SettingsRepository
    {
        return $this->once(
            SettingsRepository::class,
            fn (): SettingsRepository => new SettingsRepository($this->db())
        );
    }

    // ── 서비스 ──

    public function hasher(): PasswordHasher
    {
        return $this->once(PasswordHasher::class, static fn (): PasswordHasher => new PasswordHasher());
    }

    public function processes(): ProcessRunner
    {
        return $this->once(
            ProcessRunner::class,
            fn (): ProcessRunner => new ProcessRunner($this->logger())
        );
    }

    public function eraClassifier(): EraClassifier
    {
        return $this->once(EraClassifier::class, static fn (): EraClassifier => new EraClassifier());
    }

    public function auth(): AuthService
    {
        return $this->once(AuthService::class, fn (): AuthService => new AuthService(
            $this->members(),
            $this->families(),
            $this->hasher(),
            $this->logger(),
        ));
    }

    public function speech(): SpeechService
    {
        return $this->once(SpeechService::class, fn (): SpeechService => new SpeechService(
            $this->processes(),
            $this->logger(),
        ));
    }

    public function questionService(): QuestionService
    {
        return $this->once(QuestionService::class, fn (): QuestionService => new QuestionService(
            $this->questions(),
            $this->responses(),
            $this->eraClassifier(),
            $this->speech(),
            $this->logger(),
        ));
    }

    public function storyGenerator(): StoryGenerator
    {
        return $this->once(StoryGenerator::class, fn (): StoryGenerator => new StoryGenerator(
            $this->processes(),
            $this->logger(),
        ));
    }

    public function storyQualityEvaluator(): StoryQualityEvaluator
    {
        return $this->once(StoryQualityEvaluator::class, static fn (): StoryQualityEvaluator => new StoryQualityEvaluator());
    }

    public function followUpService(): FollowUpService
    {
        return $this->once(FollowUpService::class, fn (): FollowUpService => new FollowUpService(
            $this->questions(),
            $this->responses(),
            $this->storyQualityEvaluator(),
            $this->logger(),
        ));
    }

    public function storybook(): StorybookService
    {
        return $this->once(StorybookService::class, fn (): StorybookService => new StorybookService(
            $this->responses(),
            $this->stories(),
            $this->storyGenerator(),
            $this->eraClassifier(),
            $this->processes(),
            $this->logger(),
            $this->members(),
            $this->storyQualityEvaluator(),
            $this->followUpService(),
            $this->notificationService(),
        ));
    }

    public function fileUploads(): FileUploadService
    {
        return $this->once(
            FileUploadService::class,
            fn (): FileUploadService => new FileUploadService($this->logger())
        );
    }

    public function fcm(): FcmService
    {
        return $this->once(
            FcmService::class,
            fn (): FcmService => new FcmService($this->logger())
        );
    }

    public function notificationService(): NotificationService
    {
        return $this->once(
            NotificationService::class,
            fn (): NotificationService => new NotificationService(
                $this->notifications(),
                $this->members(),
                $this->fcm(),
                $this->logger(),
            )
        );
    }

    // ── 컨트롤러 ──

    public function familyController(): FamilyController
    {
        return $this->once(FamilyController::class, fn (): FamilyController => new FamilyController(
            $this->families(),
            $this->members(),
            $this->auth(),
            $this->hasher(),
            $this->questionService(),
            $this->logger(),
            $this->notificationService(),
        ));
    }

    public function questionController(): QuestionController
    {
        return $this->once(QuestionController::class, fn (): QuestionController => new QuestionController(
            $this->questions(),
            $this->members(),
            $this->questionService(),
            $this->logger(),
            $this->notificationService(),
        ));
    }

    public function responseController(): ResponseController
    {
        return $this->once(ResponseController::class, fn (): ResponseController => new ResponseController(
            $this->responses(),
            $this->questions(),
            $this->questionService(),
            $this->members(),
            $this->notificationService(),
        ));
    }

    public function storybookController(): StorybookController
    {
        return $this->once(
            StorybookController::class,
            fn (): StorybookController => new StorybookController($this->storybook())
        );
    }

    public function capsuleController(): CapsuleController
    {
        return $this->once(CapsuleController::class, fn (): CapsuleController => new CapsuleController(
            $this->capsules(),
            $this->logger(),
            $this->members(),
            $this->notifications(),
            $this->notificationService(),
        ));
    }

    public function calendarController(): CalendarController
    {
        return $this->once(
            CalendarController::class,
            fn (): CalendarController => new CalendarController(
                $this->calendar(),
                $this->members(),
                $this->notificationService(),
            )
        );
    }

    public function albumController(): AlbumController
    {
        return $this->once(
            AlbumController::class,
            fn (): AlbumController => new AlbumController($this->photos())
        );
    }

    public function notificationController(): NotificationController
    {
        return $this->once(
            NotificationController::class,
            fn (): NotificationController => new NotificationController(
                $this->notifications(),
                $this->notificationService(),
            )
        );
    }

    public function pollController(): PollController
    {
        return $this->once(
            PollController::class,
            fn (): PollController => new PollController(
                $this->polls(),
                $this->members(),
                $this->notificationService(),
            )
        );
    }

    public function settingsController(): SettingsController
    {
        return $this->once(
            SettingsController::class,
            fn (): SettingsController => new SettingsController($this->settings())
        );
    }

    public function voiceController(): VoiceController
    {
        return $this->once(VoiceController::class, fn (): VoiceController => new VoiceController(
            $this->speech(),
            $this->logger(),
        ));
    }

    public function uploadController(): UploadController
    {
        return $this->once(UploadController::class, fn (): UploadController => new UploadController(
            $this->fileUploads(),
            $this->photos(),
            $this->members(),
            $this->notificationService(),
        ));
    }

    public function mediaController(): MediaController
    {
        return $this->once(MediaController::class, static fn (): MediaController => new MediaController());
    }

    public function viewController(): ViewController
    {
        return $this->once(
            ViewController::class,
            fn (): ViewController => new ViewController($this->twig())
        );
    }

    public function dbViewerController(): DbViewerController
    {
        return $this->once(DbViewerController::class, fn (): DbViewerController => new DbViewerController(
            $this->db(),
            $this->twig(),
        ));
    }

    /**
     * 최초 호출 시 생성하고 이후에는 같은 인스턴스를 돌려준다.
     *
     * @template T of object
     * @param  class-string<T> $key
     * @param  callable(): T   $factory
     * @return T
     */
    private function once(string $key, callable $factory): object
    {
        /** @var T */
        return $this->instances[$key] ??= $factory();
    }
}
