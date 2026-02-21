package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.ChatMessage;
import com.campus.lostfound.model.ClaimRecord;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.SystemConfig;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.ChatMessageRepository;
import com.campus.lostfound.repository.ClaimRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ClaimService;
import com.campus.lostfound.service.SystemConfigService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRecordRepository claimRecordRepository;
    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SystemConfigService systemConfigService;

    public ClaimServiceImpl(ClaimRecordRepository claimRecordRepository,
                            LostItemRepository lostItemRepository,
                            UserRepository userRepository,
                            ChatMessageRepository chatMessageRepository,
                            SystemConfigService systemConfigService) {
        this.claimRecordRepository = claimRecordRepository;
        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.systemConfigService = systemConfigService;
    }

    @Override
    public ClaimRecord create(Long userId, Long itemId, String message, String proof, String imageUrls) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));

        if (item.getCreator().getId().equals(userId)) {
            throw new IllegalArgumentException("不能对自己发布的物品申请");
        }
        if ("CLAIMED".equals(item.getStatus()) || "MATCHED".equals(item.getStatus())) {
            throw new IllegalArgumentException("物品已被申请或已匹配");
        }
        ClaimRecord latest = claimRecordRepository.findTopByItemIdAndClaimerIdOrderByCreatedAtDesc(itemId, userId);
        if (latest != null && !"REJECTED".equals(latest.getStatus())) {
            throw new IllegalArgumentException("该物品已提交过申请，需等待审核结果");
        }
        SystemConfig cfg = systemConfigService.getConfig();
        if (!cfg.isRequireImage()) {
            String imgs = imageUrls == null ? "" : imageUrls.trim();
            if (!imgs.isEmpty()) throw new IllegalArgumentException("当前不允许上传图片");
        }

        ClaimRecord record = new ClaimRecord();
        record.setItem(item);
        record.setClaimer(user);
        record.setMessage(message);
        record.setProof(proof);
        record.setImageUrls(imageUrls);
        return claimRecordRepository.save(record);
    }

    @Override
    public List<ClaimRecord> myClaims(Long userId) {
        return claimRecordRepository.findByClaimerIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<ClaimRecord> listPendingClaims() {
        return claimRecordRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    @Override
    public ClaimRecord getMyClaimForItem(Long userId, Long itemId) {
        return claimRecordRepository.findTopByItemIdAndClaimerIdOrderByCreatedAtDesc(itemId, userId);
    }

    @Override
    public List<ClaimRecord> claimsForItem(Long userId, String role, Long itemId) {
        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("物品不存在"));
        boolean isOwner = item.getCreator().getId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role) || "SUPER_ADMIN".equals(role);
        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("无权查看");
        }
        return claimRecordRepository.findByItemIdOrderByCreatedAtDesc(itemId);
    }

    @Override
    public ClaimRecord review(Long userId, String role, Long claimId, String status, String reason) {
        ClaimRecord record = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请记录不存在"));

        boolean isOwner = record.getItem().getCreator().getId().equals(userId);
        boolean isAdmin = "ADMIN".equals(role) || "SUPER_ADMIN".equals(role);
        String currentStatus = record.getStatus();

        if ("PENDING".equals(currentStatus)) {
            if (!isAdmin) throw new IllegalArgumentException("申请需先由管理员审核");
            if ("APPROVED".equals(status)) {
                record.setStatus("ADMIN_APPROVED");
                User adminUser = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("用户不存在"));
                record.setReviewer(adminUser);
            } else if ("REJECTED".equals(status)) {
                if (reason == null || reason.trim().isEmpty()) {
                    throw new IllegalArgumentException("驳回原因不能为空");
                }
                record.setStatus("REJECTED");
                record.setRejectReason(reason.trim());
            } else {
                throw new IllegalArgumentException("无效的审核状态");
            }
        } else if ("ADMIN_APPROVED".equals(currentStatus)) {
            if (!isOwner) throw new IllegalArgumentException("仅发布者可审核该申请");
            if ("APPROVED".equals(status)) {
                record.setStatus("APPROVED");
                LostItem item = record.getItem();
                item.setStatus("MATCHED");
                lostItemRepository.save(item);
            } else if ("REJECTED".equals(status)) {
                if (reason == null || reason.trim().isEmpty()) {
                    throw new IllegalArgumentException("驳回原因不能为空");
                }
                record.setStatus("REJECTED");
                record.setRejectReason(reason.trim());
            } else {
                throw new IllegalArgumentException("无效的审核状态");
            }
        } else {
            throw new IllegalArgumentException("该申请已审核，无法重复操作");
        }
        return claimRecordRepository.save(record);
    }

    @Override
    public List<ClaimRecord> myMatchedChats(Long userId) {
        List<ClaimRecord> matched = new java.util.ArrayList<>();
        List<ClaimRecord> asClaimer = claimRecordRepository.findByClaimerIdOrderByCreatedAtDesc(userId);
        for (ClaimRecord c : asClaimer) {
            if ("APPROVED".equals(c.getStatus())) matched.add(c);
        }
        List<LostItem> myItems = lostItemRepository.findAllByCreatorIdOrderByCreatedAtDesc(userId);
        for (LostItem item : myItems) {
            List<ClaimRecord> claims = claimRecordRepository.findByItemIdOrderByCreatedAtDesc(item.getId());
            for (ClaimRecord c : claims) {
                if ("APPROVED".equals(c.getStatus()) && matched.stream().noneMatch(m -> m.getId().equals(c.getId()))) {
                    matched.add(c);
                }
            }
        }
        List<ClaimRecord> asReviewer = claimRecordRepository.findByReviewerIdOrderByCreatedAtDesc(userId);
        for (ClaimRecord c : asReviewer) {
            if ("APPROVED".equals(c.getStatus()) && matched.stream().noneMatch(m -> m.getId().equals(c.getId()))) {
                matched.add(c);
            }
        }
        matched.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return matched;
    }

    @Override
    public ClaimRecord getClaimDetail(Long userId, Long claimId) {
        ClaimRecord claim = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请记录不存在"));
        boolean isClaimer = claim.getClaimer().getId().equals(userId);
        boolean isOwner = claim.getItem().getCreator().getId().equals(userId);
        boolean isReviewer = claim.getReviewer() != null && claim.getReviewer().getId().equals(userId);
        if (!isClaimer && !isOwner && !isReviewer) {
            throw new IllegalArgumentException("无权查看");
        }
        return claim;
    }

    @Override
    public List<ClaimRecord> adminHistoryClaims(String location, String keyword, Integer days) {
        String loc = location == null ? "" : location.trim();
        String kw = keyword == null ? "" : keyword.trim();
        LocalDateTime threshold = (days != null && days > 0) ? LocalDateTime.now().minusDays(days) : null;
        return claimRecordRepository.findAll().stream()
                .filter(c -> {
                    boolean adminReviewed = c.getReviewer() != null || "REJECTED".equals(c.getStatus());
                    if (!adminReviewed) return false;
                    return true;
                })
                .filter(c -> c.getItem() != null)
                .filter(c -> loc.isEmpty() || (c.getItem().getLocation() != null && c.getItem().getLocation().contains(loc)))
                .filter(c -> kw.isEmpty()
                        || (c.getItem().getTitle() != null && c.getItem().getTitle().contains(kw))
                        || (c.getItem().getDescription() != null && c.getItem().getDescription().contains(kw)))
                .filter(c -> threshold == null || (c.getUpdatedAt() != null && c.getUpdatedAt().isAfter(threshold)))
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    public ChatMessage sendMessage(Long userId, Long claimId, String content) {
        ClaimRecord claim = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请记录不存在"));
        if (!"APPROVED".equals(claim.getStatus())) {
            throw new IllegalArgumentException("只有已通过的申请才能聊天");
        }
        boolean isClaimer = claim.getClaimer().getId().equals(userId);
        boolean isOwner = claim.getItem().getCreator().getId().equals(userId);
        boolean isReviewer = claim.getReviewer() != null && claim.getReviewer().getId().equals(userId);
        if (!isClaimer && !isOwner && !isReviewer) {
            throw new IllegalArgumentException("无权发送消息");
        }
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        ChatMessage msg = new ChatMessage();
        msg.setClaim(claim);
        msg.setSender(sender);
        msg.setContent(content);
        return chatMessageRepository.save(msg);
    }

    @Override
    public List<ChatMessage> getMessages(Long userId, Long claimId) {
        ClaimRecord claim = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请记录不存在"));
        boolean isClaimer = claim.getClaimer().getId().equals(userId);
        boolean isOwner = claim.getItem().getCreator().getId().equals(userId);
        boolean isReviewer = claim.getReviewer() != null && claim.getReviewer().getId().equals(userId);
        if (!isClaimer && !isOwner && !isReviewer) {
            throw new IllegalArgumentException("无权查看消息");
        }
        return chatMessageRepository.findByClaimIdOrderByCreatedAtAsc(claimId);
    }
}
