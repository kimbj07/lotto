package instame2.util;

import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.NameValuePair;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.multipart.ByteArrayPartSource;
import org.apache.commons.httpclient.methods.multipart.FilePart;
import org.apache.commons.httpclient.methods.multipart.MultipartRequestEntity;
import org.apache.commons.httpclient.methods.multipart.Part;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.client.params.CookiePolicy;
import org.springframework.stereotype.Component;

import common.model.Instame2Constants;
import common.util.ResourceCloseUtil;
import instame2.model.InstagramRecentImage;
import instame2.model.Instame2User;
import statistics.util.StatisticsUtil;

@Component
public class FileUploader {
    private static final Log log = LogFactory.getLog(FileUploader.class);

    private NameValuePair[] makeParams(Instame2User userInfo, InstagramRecentImage data) {
        List<NameValuePair> params = new ArrayList<NameValuePair>();
        params.add(new NameValuePair("akey", Instame2Constants.ME2DAY_AUTH_KEY));
        params.add(new NameValuePair("uid", userInfo.getMe2dayId()));
        params.add(new NameValuePair("ukey", digestKey(userInfo.getMe2dayKey())));
        params.add(new NameValuePair("post[body]", data.getContext()));
        params.add(new NameValuePair("post[tags]", data.getLocationName() + "instame2"));

        if (data.hasLocationCoordinate()) {
            params.add(new NameValuePair("longitude", Double.toString(data.getLongitude())));
            params.add(new NameValuePair("latitude", Double.toString(data.getLatitude())));
        }

        return (NameValuePair[]) params.toArray(new NameValuePair[0]);
    }

    public void uploadFile(Instame2User userInfo, InstagramRecentImage data) {
        if (log.isInfoEnabled()) {
            log.info("[Image URL : " + data.getImageUrl() + "]\n");
        }

        byte[] imageByte = readImageContent(data.getImageUrl());
        if (ArrayUtils.isEmpty(imageByte)) {
            return;
        }

        if (!StringUtils.equals(userInfo.getInstagramUserName(), data.getUserName())) {
            return;
        }

        uploadImageToMe2day(userInfo, data, imageByte);
        StatisticsUtil.logUploadImageInfo(userInfo, data);
    }

    private void uploadImageToMe2day(Instame2User userInfo, InstagramRecentImage data, byte[] imageByte) {
        PostMethod method = new PostMethod(Instame2Constants.ME2DAY_CREATE_POST_URL);
        method.setQueryString(makeParams(userInfo, data));
        Part[] parts = { new FilePart("attachment", new ByteArrayPartSource("instame2.jpg", imageByte)) };
        method.getParams().setCookiePolicy(CookiePolicy.BROWSER_COMPATIBILITY);
        method.setRequestEntity(new MultipartRequestEntity(parts, method.getParams()));

        try {
            new HttpClient().executeMethod(method);
        } catch (Exception e) {
            log.error(e, e);
        } finally {
            method.releaseConnection();
        }
    }

    private byte[] readImageContent(String imageUrl) {
        byte[] image = null;
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            ImageIO.write(ImageIO.read(new URL(imageUrl)), "jpg", baos);
            baos.flush();
            image = baos.toByteArray();
        } catch (Exception e) {
            log.error("Fail to image loading!", e);
        } finally {
            ResourceCloseUtil.close(baos);
        }

        return image;
    }

    private String digestKey(String userKey) {
        return Instame2Constants.ENC_KEY + DigestUtils.md5Hex(Instame2Constants.ENC_KEY + userKey);
    }
}
