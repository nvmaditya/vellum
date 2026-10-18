package app.vellum.reader;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.util.Locale;

public class VellumSpeech {
    private final TextToSpeech tts;
    private final WebView webView;
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean ready;
    private String currentText = "";
    private String currentId = "";

    VellumSpeech(Context context, WebView webView) {
        this.webView = webView;
        tts = new TextToSpeech(context, status -> ready = status == TextToSpeech.SUCCESS);
        tts.setOnUtteranceProgressListener(
            new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {}

                @Override
                public void onDone(String utteranceId) {
                    finish(utteranceId);
                }

                @Override
                public void onError(String utteranceId) {
                    finish(utteranceId);
                }

                @Override
                public void onRangeStart(String utteranceId, int start, int end, int frame) {
                    if (!utteranceId.equals(currentId)) return;
                    int words = 0;
                    boolean inWord = false;
                    int limit = Math.min(start, currentText.length());
                    for (int i = 0; i < limit; i += 1) {
                        boolean space = Character.isWhitespace(currentText.charAt(i));
                        if (!space && !inWord) words += 1;
                        inWord = !space;
                    }
                    final int index = Math.max(0, words - 1);
                    main.post(
                        () ->
                            webView.evaluateJavascript(
                                "window.__vellumSpeechWord&&window.__vellumSpeechWord('"
                                    + js(utteranceId)
                                    + "',"
                                    + index
                                    + ")",
                                null
                            )
                    );
                }
            }
        );
    }

    @JavascriptInterface
    public void speak(String text, double rate, String id) {
        if (ready) {
            say(text, rate, id);
            return;
        }
        main.postDelayed(
            () -> {
                if (ready) say(text, rate, id);
                else finish(id);
            },
            500
        );
    }

    @JavascriptInterface
    public void stop() {
        tts.stop();
    }

    private void say(String text, double rate, String id) {
        currentText = text == null ? "" : text;
        currentId = id;
        tts.setLanguage(Locale.US);
        tts.setSpeechRate((float) Math.max(0.5, Math.min(rate, 1.8)));
        tts.speak(currentText, TextToSpeech.QUEUE_FLUSH, null, id);
    }

    private void finish(String id) {
        main.post(
            () ->
                webView.evaluateJavascript(
                    "window.__vellumSpeechDone&&window.__vellumSpeechDone('" + js(id) + "')",
                    null
                )
        );
    }

    private String js(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("'", "\\'");
    }
}
