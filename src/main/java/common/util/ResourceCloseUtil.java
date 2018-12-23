package common.util;

import java.io.Closeable;
import java.io.IOException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class ResourceCloseUtil {
    private static final Log log = LogFactory.getLog(ResourceCloseUtil.class);

    public static void close(Closeable closeable) {
        try {
            if (closeable == null) {
                return;
            }

            closeable.close();
        } catch (IOException e) {
            log.error("Fail to close resource!", e);
        }
    }

}
