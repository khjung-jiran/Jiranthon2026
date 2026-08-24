package jiransecurity.eium_app

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.JsResult
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import jiransecurity.eium_app.ui.theme.EIUM_APPTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var webViewInstance: WebView? = null
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val data = result.data?.data
            val clipData = result.data?.clipData
            val results = if (clipData != null) {
                Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
            } else if (data != null) {
                arrayOf(data)
            } else {
                null
            }
            filePathCallback?.onReceiveValue(results)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { _ -> }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        requestInitialPermissions()
        checkAndRegisterTokenOnStart()

        // 알림으로부터 온 nav_target 확인
        val navTarget = intent.getStringExtra("nav_target")
        android.util.Log.d("FCM", "MainActivity onCreate nav_target: $navTarget")

        val initialUrl = if (navTarget != null) {
            val fullUrl = if (navTarget.startsWith("http")) navTarget else "${AppConfig.BASE_URL}$navTarget"
            android.util.Log.d("FCM", "MainActivity onCreate loading initialUrl: $fullUrl")
            fullUrl
        } else {
            AppConfig.WEB_URL
        }

        setContent {
            EIUM_APPTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    WebViewScreen(
                        url = initialUrl,
                        onWebViewCreated = { webViewInstance = it },
                        onFileChoose = { callback, intent ->
                            filePathCallback = callback
                            fileChooserLauncher.launch(intent)
                        }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent) // 새로운 인텐트로 교체
        val navTarget = intent.getStringExtra("nav_target")
        android.util.Log.d("FCM", "MainActivity onNewIntent nav_target: $navTarget")
        navTarget?.let { target ->
            navigateToUrl(target)
        }
    }

    private fun navigateToUrl(path: String) {
        val fullUrl = if (path.startsWith("http")) path else "${AppConfig.BASE_URL}$path"
        android.util.Log.d("FCM", "Navigating to URL: $fullUrl")
        webViewInstance?.post {
            webViewInstance?.loadUrl(fullUrl)
        }
    }

    private fun checkAndRegisterTokenOnStart() {
        val sharedPref = getSharedPreferences("eum_pref", Context.MODE_PRIVATE)
        val memberId = sharedPref.getString("member_id", null)
        if (memberId != null) {
            registerFcmToken(memberId)
        }
    }

    fun registerFcmToken(memberId: String, isLogout: Boolean = false) {
        val sharedPref = getSharedPreferences("eum_pref", Context.MODE_PRIVATE)
        if (isLogout) {
            sharedPref.edit().remove("member_id").apply()
        } else {
            sharedPref.edit().putString("member_id", memberId).apply()
        }

        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener

            val token = if (isLogout) null else task.result

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    FcmClient.api.registerFcmToken(memberId, FcmTokenRequest(token))
                } catch (e: Exception) {
                    // Ignore background registration errors in production
                }
            }
        }
    }

    private fun requestInitialPermissions() {
        val permissions = mutableListOf<String>()
        permissions.add(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= 33) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
            permissions.add(Manifest.permission.READ_MEDIA_VIDEO)
        } else {
            permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        val requestList = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (requestList.isNotEmpty()) {
            permissionLauncher.launch(requestList.toTypedArray())
        }
    }

    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush()
    }
}

class WebAppInterface(private val context: Context) {

    companion object {
        private const val CHANNEL_ID = "default"
        private var channelCreated = false
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        val sharedPref = context.getSharedPreferences("eum_pref", Context.MODE_PRIVATE)
        val memberId = sharedPref.getString("member_id", null)
        if (memberId != null) {
            (context as? MainActivity)?.registerFcmToken(memberId)
        }

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !channelCreated) {
            val channel = NotificationChannel(CHANNEL_ID, "이음 알림", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "이음 앱 알림"
            }
            notificationManager.createNotificationChannel(channel)
            channelCreated = true
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    @JavascriptInterface
    fun registerFcmToken(memberId: String) {
        (context as? MainActivity)?.registerFcmToken(memberId)
    }

    @JavascriptInterface
    fun callHandler(handlerName: String, data: String) {
        when (handlerName) {
            "registerFcm" -> (context as? MainActivity)?.registerFcmToken(data)
            "logout" -> (context as? MainActivity)?.registerFcmToken(data, isLogout = true)
        }
    }

    @JavascriptInterface
    fun registerFcm(memberId: String) {
        (context as? MainActivity)?.registerFcmToken(memberId)
    }

    @JavascriptInterface
    fun exitApp() {
        (context as? MainActivity)?.finish()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    url: String,
    onWebViewCreated: (WebView) -> Unit,
    onFileChoose: (ValueCallback<Array<Uri>>, Intent) -> Unit
) {
    var webView: WebView? by remember { mutableStateOf(null) }

    // 뒤로가기 처리는 웹(base.html.twig 의 window.onAppBackPressed)에 위임한다.
    //   - 홈 경로: 두 번 눌러 종료 (AndroidBridge.exitApp 호출)
    //   - 그 외:   history.back()
    // 웹에 onAppBackPressed 가 없는 페이지(예: 로딩 직후)는 canGoBack() 로 폴백.
    BackHandler(enabled = true) {
        val wv = webView
        if (wv == null) return@BackHandler
        if (wv.canGoBack()) {
            wv.evaluateJavascript(
                "if(typeof window.onAppBackPressed==='function'){window.onAppBackPressed()}else{window.history.back()}",
                null,
            )
        } else {
            // 히스토리가 없으면 웹 쪽 onAppBackPressed 에게 맡긴다 (홈 → 두 번 눌러 종료).
            wv.evaluateJavascript(
                "if(typeof window.onAppBackPressed==='function'){window.onAppBackPressed()}",
                null,
            )
        }
    }

    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webView = this
                onWebViewCreated(this)

                CookieManager.getInstance().setAcceptCookie(true)
                CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

                addJavascriptInterface(WebAppInterface(context), "Android")
                addJavascriptInterface(WebAppInterface(context), "AndroidBridge")

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    mediaPlaybackRequiresUserGesture = false
                }

                webViewClient = object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView?,
                        request: android.webkit.WebResourceRequest?,
                        error: android.webkit.WebResourceError?
                    ) {
                        super.onReceivedError(view, request, error)
                        android.util.Log.e("WEBVIEW", "Error loading page: ${error?.description}")
                    }

                    override fun onReceivedSslError(
                        view: WebView?,
                        handler: android.webkit.SslErrorHandler?,
                        error: android.net.http.SslError?
                    ) {
                        // 사설 인증서(Self-signed) 등을 사용하는 경우에도 접속을 허용합니다.
                        android.util.Log.w("WEBVIEW", "SSL Error occurred: $error")
                        handler?.proceed()
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                        AlertDialog.Builder(context).setMessage(message).setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }.setCancelable(false).create().show()
                        return true
                    }
                    override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                        AlertDialog.Builder(context).setMessage(message).setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }.setNegativeButton(android.R.string.cancel) { _, _ -> result?.cancel() }.setCancelable(false).create().show()
                        return true
                    }
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        val resources = request?.resources ?: return
                        request.grant(resources)
                    }
                    override fun onShowFileChooser(webView: WebView?, filePathCallback: ValueCallback<Array<Uri>>?, fileChooserParams: FileChooserParams?): Boolean {
                        val intent = fileChooserParams?.createIntent()
                        if (intent != null && filePathCallback != null) {
                            onFileChoose(filePathCallback, intent)
                        }
                        return true
                    }
                }
                loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
