package lotto.param;

import org.apache.commons.lang.StringUtils;

public enum Order {
	asc, desc;

	public static Order getOrder(String order) {
		if (StringUtils.isBlank(order)) {
			return desc;
		}

		if (StringUtils.equalsIgnoreCase(asc.name(), order)) {
			return asc;
		} else {
			return desc;
		}
	}

}
