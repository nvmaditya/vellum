package app.vellum.reader;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge == null || bridge.getWebView() == null) return;
        WebView webView = bridge.getWebView();
        webView.addJavascriptInterface(new VellumSpeech(this, webView), "VellumTts");
    }
}
