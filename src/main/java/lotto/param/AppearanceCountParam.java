package lotto.param;

import org.apache.commons.lang.StringUtils;

public class AppearanceCountParam {
	private Integer from;
	private Integer to;
	private Integer count;
	private String sortBy;
	private String order;

	enum SortBy {
		winCount, bonusCount, sumCount, number;

		public static SortBy getSortBy(String sortBy) {
			if (StringUtils.isBlank(sortBy)) {
				return winCount;
			}

			for (SortBy value : values()) {
				if (StringUtils.startsWithIgnoreCase(value.name(), sortBy)) {
					return value;
				}
			}

			return winCount;
		}
	}

	public AppearanceCountParam() {
	}

	public AppearanceCountParam(Integer from, Integer to, Integer count, String sortBy, String order) {
		this.from = from;
		this.to = to;
		this.count = count;
		this.sortBy = sortBy;
		this.order = order;
	}

	public void setFrom(Integer from) {
		this.from = from;
	}

	public Integer getFrom() {
		return from;
	}

	public void setTo(Integer to) {
		this.to = to;
	}

	public Integer getTo() {
		return to;
	}

	public Integer getCount() {
		return count;
	}

	public void setCount(Integer count) {
		this.count = count;
	}

	public void setSortBy(String sortBy) {
		this.sortBy = sortBy;
	}

	public String getSortBy() {
		return SortBy.getSortBy(sortBy).name();
	}

	public void setOrder(String order) {
		this.order = order;
	}

	public String getOrder() {
		if (StringUtils.isNotBlank(order)) {
			return Order.getOrder(order).name();
		}

		if (StringUtils.equals(SortBy.number.name(), getSortBy())) {
			return Order.asc.name();
		} else {
			return Order.desc.name();
		}
	}
}
