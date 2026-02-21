package com.campus.lostfound.service;

import com.campus.lostfound.model.User;

import java.util.Map;

public interface AuthService {

    User register(String username, String password, String realName, String phone, String idCard);

    Map<String, Object> login(String username, String password);

    void changePassword(Long userId, String oldPassword, String newPassword);

    User getUserById(Long userId);
}
