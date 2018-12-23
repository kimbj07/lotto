package common.util;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;

public class DateUtilTest {

    @Test
    public void testYYYY_MM_DD_PATTENN() {
        assertThat(DateUtil.isYYYY_MM_DDFormat("2012-09-21"), is(true));
        assertThat(DateUtil.isYYYY_MM_DDFormat("09-21"), is(false));
        assertThat(DateUtil.isYYYY_MM_DDFormat(""), is(false));
        assertThat(DateUtil.isYYYY_MM_DDFormat("null"), is(false));
        assertThat(DateUtil.isYYYY_MM_DDFormat("9999-99-99"), is(true));
    }
}
