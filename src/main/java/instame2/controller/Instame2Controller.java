package instame2.controller;

import instame2.bo.Instame2BO;
import instame2.model.Instame2User;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import statistics.util.StatisticsUtil;

import common.model.Instame2Constants;

@Controller
public class Instame2Controller {
	private static final Log log = LogFactory.getLog(Instame2Controller.class);

	@Autowired
	public Instame2BO instame2BO;

	@ExceptionHandler(Exception.class)
	public ModelAndView exceptionHandler(Exception exception) {
		return new ModelAndView("redirect:main.nj");
	}

	@RequestMapping("/main")
	public ModelAndView instame2() throws Exception {
		ModelAndView mav = new ModelAndView("instame2_register");
		mav.addObject("me2dayAuthUrl", instame2BO.acquireMe2DayAuthUrl());
		return mav;
	}

	@RequestMapping("/register")
	public ModelAndView register(@RequestParam("code") String code, @RequestParam("me2dayUserId") String me2dayUserId) throws Exception {
		StatisticsUtil.logStatistics(Instame2Constants.REGISTER, me2dayUserId); // 통계 로그

		instame2BO.registerUser(code, me2dayUserId); // 사용자 연동정보 저장
		ModelAndView mav = new ModelAndView("instame2_register");
		mav.addObject("instame2UserInfo", instame2BO.acquireInstame2User(me2dayUserId));

		return mav;
	}

	/**
	 * Instagram에 구독 사용자 등록시 URL 검증을 위해 hub.challenge 키를 반환해야 한다.
	 * 
	 * @param instagramAuthKey
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "/subscriptions", method = RequestMethod.GET)
	public ModelAndView registerSubscriptions(@RequestParam(value = "hub.challenge", required = false) String instagramAuthKey) throws Exception {
		ModelAndView mav = new ModelAndView("instagramAuthKey");
		mav.addObject("instagramAuthKey", instagramAuthKey);
		return mav;
	}

	/**
	 * Instagram 유저가 사진을 등록할 경우 호출되는 CALLBACK-URL
	 * 
	 * @param requestBody - json 포맷의 사용자의 사진 업데이트에 대한 정보
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "/subscriptions", method = RequestMethod.POST)
	public void subscriptions(@RequestBody String requestBody) throws Exception {
		StatisticsUtil.logStatistics(Instame2Constants.POSTING, requestBody); // 통계 로그

		if (log.isInfoEnabled()) {
			log.info("subscriptions method is called!\n[RequestBody : " + requestBody + "]\n");
		}

		instame2BO.syncMe2Day(requestBody);
	}

	@RequestMapping("/saveMe2DayKey")
	public ModelAndView saveMe2DayKey(@RequestParam("user_id") String userId, @RequestParam("user_key") String userKey) throws Exception {
		return new ModelAndView("redirect:login.nj?userId=" + userId + "&userKey=" + userKey);
	}

	@RequestMapping("/leave")
	public String leave(@RequestParam("me2dayId") String me2dayId, @RequestParam("instagramUserName") String instagramUserName) throws Exception {
		StatisticsUtil.logStatistics(Instame2Constants.LEAVE, me2dayId);

		int deleteCnt = instame2BO.leave(me2dayId, instagramUserName);
		if (deleteCnt == 0) {
			return "redirect:main.nj";
		}

		return "instame2_leave";
	}

	@RequestMapping("/login")
	public ModelAndView login(@RequestParam("userId") String userId, @RequestParam("userKey") String userKey) throws Exception {
		Instame2User instame2User = instame2BO.acquireInstame2User(userId);

		ModelAndView mav = new ModelAndView();
		if (instame2User != null && instame2User.isMember()) {
			StatisticsUtil.logStatistics(Instame2Constants.LOGIN, userId);
			mav.setViewName("instame2_loggedin");
			mav.addObject("instame2UserInfo", instame2User);
		} else {
			mav.setViewName("instame2_register");
			mav.addObject("instagramAuthUrl", instame2BO.acquireInstagramAuthUrl(userId));
			mav.addObject("me2dayUserInfo", instame2BO.saveMe2dayUserKey(userId, userKey));
		}

		return mav;
	}
}
