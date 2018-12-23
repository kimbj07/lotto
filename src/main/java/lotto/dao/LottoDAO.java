package lotto.dao;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.SortedSet;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ibatis.SqlMapClientTemplate;
import org.springframework.stereotype.Repository;

import lotto.model.AppearanceCount;
import lotto.model.GameInfo;
import lotto.model.GameInfoForDB;
import lotto.model.MyRankInGame;
import lotto.param.AppearanceCountParam;
import lotto.param.GameInfoInRangeParam;
import lotto.util.LottoConstant;

@Repository
public class LottoDAO {
    private static final String NAMESPACE = "lotto.";

    @Autowired
    private SqlMapClientTemplate lottoClient;

    public void insertGameInfo(GameInfo gameInfo) {
        lottoClient.insert(NAMESPACE + "insertGameInfo", gameInfo);
    }

    public void insertWinnerBalls(int gameNo, SortedSet<Integer> balls) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put(LottoConstant.DB.GAME_NO, gameNo);
        params.put(LottoConstant.DB.WINNER_BALLS, new ArrayList<Integer>(balls));
        lottoClient.insert(NAMESPACE + "insertWinnerBalls", params);
    }

    public void insertBonusBall(int gameNo, int bonusBall) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put(LottoConstant.DB.GAME_NO, gameNo);
        params.put(LottoConstant.DB.BONUS_BALL, bonusBall);
        lottoClient.insert(NAMESPACE + "insertBonusBall", params);
    }

    public int selectLastSavedGameNo() {
        Integer lastSavedGameNo = (Integer) lottoClient.queryForObject(NAMESPACE + "selectLastSavedGameNo");
        return lastSavedGameNo == null ? 0 : lastSavedGameNo;
    }

    @SuppressWarnings("unchecked")
    public List<MyRankInGame> selectMyRankInHistory(SortedSet<Integer> myNumbers) {
        List<Integer> params = new ArrayList<Integer>(myNumbers);
        return (List<MyRankInGame>) lottoClient.queryForList(NAMESPACE + "selectMyRankInHistory", params);
    }

    @SuppressWarnings("unchecked")
    public List<AppearanceCount> selectAppearanceCount(AppearanceCountParam params) {
        return (List<AppearanceCount>) lottoClient.queryForList(NAMESPACE + "selectAppearanceCount", params);
    }

    @SuppressWarnings("unchecked")
    public List<GameInfoForDB> selectGameInfoInRange(GameInfoInRangeParam params) {
        return (List<GameInfoForDB>) lottoClient.queryForList(NAMESPACE + "selectGameInfoInRange", params);
    }

}
