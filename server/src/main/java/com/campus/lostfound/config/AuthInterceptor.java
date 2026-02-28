package com.campus.lostfound.config;

import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;
    private final UserRepository userRepository;

    public AuthInterceptor(StringRedisTemplate redisTemplate, UserRepository userRepository) {
        this.redisTemplate = redisTemplate;
        this.userRepository = userRepository;
    }

    private static final java.util.Set<String> PUBLIC_PATHS = java.util.Set.of(
            "/api/items", "/api/announcements", "/api/config"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String userId = redisTemplate.opsForValue().get("lf:token:" + token);
            if (userId != null) {
                Long uid;
                try {
                    uid = Long.parseLong(userId);
                } catch (NumberFormatException ex) {
                    redisTemplate.delete("lf:token:" + token);
                    redisTemplate.delete("lf:role:" + token);
                    reject(response, "登录已失效");
                    return false;
                }
                User user = userRepository.findById(uid).orElse(null);
                if (user == null || !user.isEnabled()) {
                    redisTemplate.delete("lf:token:" + token);
                    redisTemplate.delete("lf:role:" + token);
                    reject(response, "账号已被禁用");
                    return false;
                }
                String role = redisTemplate.opsForValue().get("lf:role:" + token);
                request.setAttribute("loginUserId", uid);
                request.setAttribute("loginUserRole", role != null ? role : user.getRole());
                return true;
            }
        }

        String path = request.getRequestURI();
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method)) {
            for (String pub : PUBLIC_PATHS) {
                if (path.equals(pub) || path.startsWith(pub + "/")) {
                    return true;
                }
            }
        }

        reject(response, authHeader == null ? "未登录" : "登录已失效");
        return false;
    }

    private void reject(HttpServletResponse response, String msg) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"message\":\"" + msg + "\",\"data\":null}");
    }
}
