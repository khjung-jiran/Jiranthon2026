/**
 * 공통 컴포넌트 배럴. 화면은 여기서 한 번에 import 한다:
 *   import { ScreenContainer, Header, Button, Card, Pill, SectionLabel,
 *            VoiceBars, EqBars, RecordingWave, Toast, ToastHost,
 *            PushBanner, PushHost, Overlay, ImageSlot, Icon } from '../components';
 */
export { ScreenContainer } from './ScreenContainer';
export type { ScreenContainerProps } from './ScreenContainer';

export { Header } from './Header';
export type { HeaderProps } from './Header';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Pill } from './Pill';
export type { PillProps } from './Pill';

export { SectionLabel } from './SectionLabel';
export type { SectionLabelProps } from './SectionLabel';

export { VoiceBars } from './VoiceBars';
export { EqBars } from './EqBars';
export type { EqBarsProps } from './EqBars';
export { RecordingWave } from './RecordingWave';
export type { RecordingWaveProps } from './RecordingWave';

export { PulseRing } from './PulseRing';
export type { PulseRingProps } from './PulseRing';

export { Toast, ToastHost } from './Toast';
export type { ToastProps } from './Toast';

export { PushBanner, PushHost } from './PushBanner';
export type { PushBannerProps } from './PushBanner';

export { Overlay } from './Overlay';
export type { OverlayProps } from './Overlay';

export { ImageSlot } from './ImageSlot';
export type { ImageSlotProps, ImageSlotShape } from './ImageSlot';

// 아이콘은 src/icons.ts에서 재노출
export { Icon, iconMap, resolveIcon } from '../icons';
export type { IconProps } from '../icons';
