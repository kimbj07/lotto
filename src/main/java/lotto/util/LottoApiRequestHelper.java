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
			new HttpClient().executeMethod(method);
			String html = IOUtils.toString(method.getResponseBodyAsStream(), "EUC-KR");
			String latestGameNo = StringUtils.substringBefore(StringUtils.substringAfter(html, "lottoDrwNo\">"), "<");
			return NumberUtils.toInt(latestGameNo, 0);
		} catch (Exception e) {
			log.error("init method error", e);
		} finally {
			method.releaseConnection();
		}

		return 0;
		
	}

}
