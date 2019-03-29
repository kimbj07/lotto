package lotto.util;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.math.NumberUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import net.sf.json.JSONSerializer;

import lotto.bo.LottoBO;

public class LottoApiRequestHelper {
    public static final String IE_USER_AGENT =
            "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; MAAU; .NET4.0C; .NET4.0E; InfoPath.2; rv:11.0) like Gecko";

    private static final Log log = LogFactory.getLog(LottoBO.class);

    /**
     *
     * @param requestURL
     * @return
     */
    public static Object executeRequest(String requestURL) {
        Object json = null;

        HttpMethod method = new GetMethod(requestURL);
        try {
            method.setRequestHeader("User-Agent", IE_USER_AGENT);
            new HttpClient().executeMethod(method);
            json = JSONSerializer.toJSON(IOUtils.toString(method.getResponseBodyAsStream(), "EUC-KR"));
        } catch (Exception e) {
            log.error("init method error", e);
        } finally {
            method.releaseConnection();
        }

        return json;
    }

    public static int getLatestGameNo() {
        HttpMethod method = new GetMethod(LottoURL.LATEST_GAME_INFO);
        try {
            method.setRequestHeader("User-Agent", IE_USER_AGENT);
            new HttpClient().executeMethod(method);
            String html = IOUtils.toString(method.getResponseBodyAsStream(), "EUC-KR");
            String latestGameNo = StringUtils.substringBefore(
                    StringUtils.substringAfter(html, "<strong id=\"lottoDrwNo\">"), "<");
            return NumberUtils.toInt(latestGameNo, 0);
        } catch (Exception e) {
            log.error("init method error", e);
        } finally {
            method.releaseConnection();
        }

        return 0;

    }

}
