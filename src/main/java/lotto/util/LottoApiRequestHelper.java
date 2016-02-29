package lotto.util;

import lotto.bo.LottoBO;
import net.sf.json.JSONSerializer;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

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

}
