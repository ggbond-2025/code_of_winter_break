package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.Announcement;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.AnnouncementRepository;
import com.campus.lostfound.repository.ComplaintRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.SuperAdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class SuperAdminServiceImpl implements SuperAdminService {

    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final LostItemRepository lostItemRepository;
    private final ComplaintRecordRepository complaintRecordRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminServiceImpl(UserRepository userRepository,
                                 AnnouncementRepository announcementRepository,
                                 LostItemRepository lostItemRepository,
                                 ComplaintRecordRepository complaintRecordRepository,
                                 PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.announcementRepository = announcementRepository;
        this.lostItemRepository = lostItemRepository;
        this.complaintRecordRepository = complaintRecordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Page<User> listUsers(String keyword, String role, int page, int size) {
        Page<User> res = userRepository.search(keyword, role, PageRequest.of(page, size));
        res.getContent().forEach(u -> u.setComplaintCount((int) complaintRecordRepository.countByTargetId(u.getId())));
        return res;
    }

    @Override
    public User createAdmin(String username, String password, String realName, String phone, String region) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("ADMIN");
        user.setRealName(realName);
        user.setPhone(phone);
        user.setRegion(region);
        user.setFirstLogin(true);
        return userRepository.save(user);
    }

    @Override
    public User toggleUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setEnabled(!user.isEnabled());
        return userRepository.save(user);
    }

    @Override
    public void resetPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setPassword(passwordEncoder.encode("123456"));
        user.setFirstLogin(true);
        userRepository.save(user);
    }

    @Override
    public List<Announcement> allAnnouncements() {
        return announcementRepository.findAll();
    }

    @Override
    public Announcement createAnnouncement(Long authorId, String title, String content) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        Announcement a = new Announcement();
        a.setTitle(title);
        a.setContent(content);
        a.setAuthor(author);
        a.setScope("GLOBAL");
        a.setStatus("APPROVED");
        a.setActive(true);
        return announcementRepository.save(a);
    }

    @Override
    public List<Announcement> pendingRegionAnnouncements() {
        return announcementRepository.findByScopeAndStatusOrderByCreatedAtDesc("REGION", "PENDING");
    }

    @Override
    public Announcement approveRegionAnnouncement(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("公告不存在"));
        if (!"REGION".equals(a.getScope())) {
            throw new IllegalArgumentException("仅地区公告可审核");
        }
        a.setStatus("APPROVED");
        a.setActive(true);
        return announcementRepository.save(a);
    }

    @Override
    public Announcement rejectRegionAnnouncement(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("公告不存在"));
        if (!"REGION".equals(a.getScope())) {
            throw new IllegalArgumentException("仅地区公告可审核");
        }
        a.setStatus("REJECTED");
        a.setActive(false);
        return announcementRepository.save(a);
    }

    @Override
    public Announcement toggleAnnouncement(Long announcementId) {
        Announcement a = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("公告不存在"));
        if (!"APPROVED".equals(a.getStatus()) && a.getStatus() != null) {
            throw new IllegalArgumentException("仅已通过的公告可启用/停用");
        }
        a.setActive(!a.isActive());
        return announcementRepository.save(a);
    }

    @Override
    public void deleteAnnouncement(Long announcementId) {
        announcementRepository.deleteById(announcementId);
    }

    @Override
    public Map<String, Object> globalStats() {
        return Map.of(
                "totalUsers", userRepository.count(),
                "studentCount", userRepository.countByRole("USER"),
                "adminCount", userRepository.countByRole("ADMIN"),
                "totalItems", lostItemRepository.count(),
                "pendingItems", lostItemRepository.countByStatus("PENDING"),
                "claimedItems", lostItemRepository.countByStatus("CLAIMED"),
                "archivedItems", lostItemRepository.countByStatus("ARCHIVED")
        );
    }
}
