package lotto.param;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Test;

public class AppearanceCountParamTest {
    @Test
    public void sortByTest() {
        AppearanceCountParam param = new AppearanceCountParam();
        assertThat(param.getSortBy(), is("winCount"));

        param.setSortBy("bonus");
        assertThat(param.getSortBy(), is("bonusCount"));

        param.setSortBy("sum");
        assertThat(param.getSortBy(), is("sumCount"));

        param.setSortBy("number");
        assertThat(param.getSortBy(), is("number"));

        param.setSortBy("win");
        assertThat(param.getSortBy(), is("winCount"));

        param.setSortBy("");
        assertThat(param.getSortBy(), is("winCount"));

        param.setSortBy("sortBy");
        assertThat(param.getSortBy(), is("winCount"));
    }

    @Test
    public void orderTest() {
        AppearanceCountParam param;

        param = new AppearanceCountParam();
        assertThat(param.getOrder(), is("desc"));

        param = new AppearanceCountParam();
        param.setOrder("asc");
        assertThat(param.getOrder(), is("asc"));

        param = new AppearanceCountParam();
        param.setSortBy("number");
        assertThat(param.getOrder(), is("asc"));

        param = new AppearanceCountParam();
        param.setSortBy("number");
        param.setOrder("desc");
        assertThat(param.getOrder(), is("desc"));

        param = new AppearanceCountParam();
        param.setSortBy("number");
        param.setOrder("order");
        assertThat(param.getOrder(), is("desc"));

        param = new AppearanceCountParam();
        param.setSortBy("");
        assertThat(param.getOrder(), is("desc"));

        param = new AppearanceCountParam();
        param.setSortBy("order");
        assertThat(param.getOrder(), is("desc"));
    }
}
