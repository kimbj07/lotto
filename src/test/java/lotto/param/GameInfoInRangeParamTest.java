package lotto.param;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;

public class GameInfoInRangeParamTest {
    @Test
    public void orderBy() {
        GameInfoInRangeParam param = new GameInfoInRangeParam();
        assertThat(param.getOrder(), is("desc"));

        param.setOrder("asc");
        assertThat(param.getOrder(), is("asc"));

        param.setOrder("desc");
        assertThat(param.getOrder(), is("desc"));

        param.setOrder("");
        assertThat(param.getOrder(), is("desc"));

        param.setOrder("order");
        assertThat(param.getOrder(), is("desc"));
    }
}
