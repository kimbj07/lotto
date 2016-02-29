package lotto.util;

import java.security.InvalidParameterException;
import java.text.ParseException;
import java.util.Date;
import java.util.SortedSet;
import java.util.TreeSet;

import org.apache.commons.lang.time.DateUtils;

import net.sf.json.JSONObject;

import lotto.model.GameInfoForApi;

public class GameInfoConvert {
	private static final String[] DATE_FORMAT = {"yyyy-MM-dd"};

	public static GameInfoForApi convertTo(JSONObject json) throws ParseException {
		if (json == null) {
			throw new InvalidParameterException();
		}

		GameInfoForApi gameInfo = new GameInfoForApi();

		// 회차 및 추첨 날짜
		gameInfo.setGameNo(json.getInt(LottoConstant.Api.GAME_NO));
		Date gameDate = DateUtils.parseDate(json.getString(LottoConstant.Api.GAME_DATE), DATE_FORMAT);

		gameInfo.setGameDate(gameDate);

		// 당첨 번호		
		SortedSet<Integer> balls = new TreeSet<Integer>();
		balls.add(json.getInt(LottoConstant.Api.FIRST_BALL));
		balls.add(json.getInt(LottoConstant.Api.SECOND_BALL));
		balls.add(json.getInt(LottoConstant.Api.THIRD_BALL));
		balls.add(json.getInt(LottoConstant.Api.FOURTH_BALL));
		balls.add(json.getInt(LottoConstant.Api.FIFTH_BALL));
		balls.add(json.getInt(LottoConstant.Api.SIXTH_BALL));
		gameInfo.setBalls(balls);

		// 보너스 볼
		gameInfo.setBonusBall(json.getInt(LottoConstant.Api.BONUS_BALL));

		// 1등 당첨 정보
		gameInfo.setFirstWinnerCount(json.getInt(LottoConstant.Api.FIRST_WINNER_COUNT));
		gameInfo.setFirstWinnerAmount(json.getLong(LottoConstant.Api.FIRST_WINNER_AMOUNT));

		// 총 판매액 및 총 당첨금 정보
		gameInfo.setTotalSellAmount(json.getLong(LottoConstant.Api.TOTAL_SELL_AMOUNT));

		return gameInfo;
	}
}
