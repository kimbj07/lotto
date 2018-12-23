package instame2.controller;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.junit.Ignore;
import org.junit.Test;

public class Instame2ControllerTest {
    private static final String DOMAIN = "http://instame2.com/subscriptions.nj";

    @Ignore
    @Test
    public void testSubscriptions() throws Exception {
        String postBody =
                "[{\"changed_aspect\": \"media\", \"subscription_id\": 924735, \"object\": \"user\", \"object_id\": \"9686940\", \"time\": 1323662671}]";
        PostMethod post = new PostMethod(DOMAIN);
        post.setRequestEntity(new StringRequestEntity(postBody, "application/x-www-form-urlencoded", "UTF-8"));
        new HttpClient().executeMethod(post);
    }
}
