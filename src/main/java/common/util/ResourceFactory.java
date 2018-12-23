package common.util;

import java.io.InputStream;

import javax.xml.transform.stream.StreamSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

import common.model.DataResource;
import instame2.error.Instame2Exception;

/**
 * @author nhn
 */
public class ResourceFactory {
    private static final Logger log = LoggerFactory.getLogger(ResourceFactory.class);
    private static final String DATA_RESOURCE = "/data-resource.xml";
    private static DataResource dataResource = null;

    private ResourceFactory() {
    }

    public static DataResource getDataResource() {
        if (dataResource == null) {
            dataResource = (DataResource) getResource(DATA_RESOURCE, DataResource.class);
        }

        return dataResource;
    }

    private static <T> Object getResource(String fileName, Class<T> clazz) {
        InputStream stream = null;
        try {
            stream = ResourceFactory.class.getResourceAsStream(fileName);
            return createJaxbMarshaller(clazz).unmarshal(new StreamSource(stream));
        } catch (Exception e) {
            log.error("Fail to road resource file! Resource path is " + fileName, e);
            throw new Instame2Exception(e);
        } finally {
            ResourceCloseUtil.close(stream);
        }
    }

    private static <T> Jaxb2Marshaller createJaxbMarshaller(Class<T> clazz) {
        Jaxb2Marshaller unmarshaller = new Jaxb2Marshaller();
        unmarshaller.setClassesToBeBound(clazz);
        return unmarshaller;
    }
}
