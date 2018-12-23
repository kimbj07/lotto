package common.util;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;

import common.model.DataResource;

public class ResourceFactoryTest {

    @Test
    public void 데이터리소스_로딩_테스트() {
        DataResource dataResource = ResourceFactory.getDataResource();
        assertThat(dataResource.getStatisticsFileName(), is("statistics.log"));
    }
}
