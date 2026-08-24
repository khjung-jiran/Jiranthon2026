package jiransecurity.eium_app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        var navTarget: String? = null
        if (remoteMessage.data.isNotEmpty()) {
            navTarget = remoteMessage.data["nav_target"]
        }
        android.util.Log.d("FCM", "onMessageReceived called. nav_target: $navTarget")

        remoteMessage.notification?.let {
            android.util.Log.d("FCM", "Notification present: ${it.title} / ${it.body}")
            sendNotification(it.title ?: "이음 알림", it.body ?: "", navTarget)
        } ?: run {
            if (remoteMessage.data.containsKey("title") || remoteMessage.data.containsKey("body")) {
                android.util.Log.d("FCM", "Data-only notification: ${remoteMessage.data["title"]}")
                sendNotification(
                    remoteMessage.data["title"] ?: "이음 알림",
                    remoteMessage.data["body"] ?: "",
                    navTarget
                )
            }
        }
    }

    override fun onNewToken(token: String) {
        val sharedPref = getSharedPreferences("eum_pref", Context.MODE_PRIVATE)
        val memberId = sharedPref.getString("member_id", null)
        if (memberId != null) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    FcmClient.api.registerFcmToken(memberId, FcmTokenRequest(token))
                } catch (e: Exception) {
                    // Ignore token update errors in background
                }
            }
        }
    }

    private fun sendNotification(title: String, messageBody: String, navTarget: String?) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            if (navTarget != null) {
                putExtra("nav_target", navTarget)
            }
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "default"
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info) 
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "이음 알림",
                NotificationManager.IMPORTANCE_HIGH
            )
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }
}
