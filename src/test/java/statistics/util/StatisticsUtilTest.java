package statistics.util;

import org.junit.Test;

public class StatisticsUtilTest {

	@Test
	public void test() {
		StatisticsUtil.logStatistics("TestAction", "TestStringMessage");
		StatisticsUtil.logStatistics("TestAction", "{\"key1\":\"value\", \"key2\":\"value2\"}");
	}
}
