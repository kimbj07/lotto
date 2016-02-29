package common.model;

import org.apache.commons.httpclient.NameValuePair;

public class Instame2Constants {
	public static final String DOMAIN = "http://instame2.com/";

	// Instgram 에 필요한 상수
	public static final String REGISTER_URL = DOMAIN + "register.nj";
	public static final String SUBSCRIPTION_URL = DOMAIN + "subscriptions.nj";

	public static final String CLIENT_ID = "91c3c93785684d8884ec207ab890e3c7";
	public static final String CLIENT_SECRET = "4995fc370db94f3687153600a8a39c92";

	public static final String INSTAGRAM_USER_AUTHORIZATION_URL = "https://api.instagram.com/oauth/authorize/?response_type=code&client_id=" + CLIENT_ID + "&redirect_uri=" + Instame2Constants.REGISTER_URL;
	public static final String INSTAGRAM_SUBSCRIPTIONS_URL = "https://api.instagram.com/v1/subscriptions/";
	public static final String INSTAGRAM_ACCESS_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
	public static final String INSTAGRAM_FEED_URL = "https://api.instagram.com/v1/users/self/media/recent?access_token=";
	public static final String INSTAGRAM_DELETE_URL = "https://api.instagram.com/v1/subscriptions?client_secret=" + CLIENT_SECRET + "&client_id=" + CLIENT_ID + "&id=";

	public static final NameValuePair[] DEFAULT_PARAMS = {new NameValuePair("client_id", CLIENT_ID), new NameValuePair("client_secret", CLIENT_SECRET)};
	public static final NameValuePair[] SUBSRIPTIONS_PARAMS = {new NameValuePair("aspect", "media"), new NameValuePair("object", "user"), new NameValuePair("callback_url", Instame2Constants.SUBSCRIPTION_URL)};

	// 미투데이에서 필요한 상수
	public static final String ME2DAY_AUTH_KEY = "cef61312608d17fb9807f1c79a382905";
	public static final String ME2DAY_GET_AUTH_URL = "http://me2day.net/api/get_auth_url.json?akey=" + ME2DAY_AUTH_KEY;
	public static final String ME2DAY_GET_PERSON = "http://me2day.net/api/get_person/";
	public static final String ME2DAY_CREATE_POST_URL = "http://me2day.net/api/create_post.xml";
	//	public static final String ME2DAY_CREATE_POST_URL = "http://me2day.net/api/create_post.xml?&akey=" + ME2DAY_AUTH_KEY + "&uid=${userid}&ukey=${userkey}&post[tags]=instame2&post[body]=";
	public static final String ENC_KEY = "byoungje";

	// STATISTICS LOG TAG
	public static final String ERROR = "[INSTAME2_ERROR]";
	public static final String STATISTICS_OPEN = "[STATISTICS-OPEN[#|";
	public static final String STATISTICS_CLOSE = "|#]STATISTICS-CLOSE]";
	public static final String DELEMETER = "|#|";
	public static final String ACTION = "action";
	public static final String MESSAGE = "message";

	// ACTION
	public static final String LEAVE = "leave";
	public static final String POSTING = "posting";
	public static final String REGISTER = "register";
	public static final String LOGIN = "login";

	public static final String LOG_FILE_DATE_FORMAT = "yyyy-MM-dd";
	public static final String TOMCAT_LOGGING_TIME_FORMAT = "yyyy-MM-dd hh:mm:ss";
}
