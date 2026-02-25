package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.ChatMessage;
import com.campus.lostfound.model.ClaimRecord;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.ChatMessageRepository;
import com.campus.lostfound.repository.ClaimRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ClaimService;
import com.campus.lostfound.service.SystemConfigService;
import com.campus.lostfound.service.SystemNotificationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClaimServiceImpl implements ClaimService {

    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_MATCHED = "MATCHED";
    private static final String STATUS_CLAIMED = "CLAIMED";
    private static final String STATUS_CLAIM_ADMIN_REVIEW = "CLAIM_ADMIN_REVIEW";
    private static final String STATUS_CLAIM_OWNER_REVIEW = "CLAIM_OWNER_REVIEW";

    private final ClaimRecordRepository claimRecordRepository;
    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SystemConfigService systemConfigService;
    private final SystemNotificationService systemNotificationService;

    public ClaimServiceImpl(ClaimRecordRepository claimRecordRepository,
                            LostItemRepository lostItemRepository,
                            UserRepository userRepository,
                            ChatMessageRepository chatMessageRepository,
                            SystemConfigService systemConfigService,
                            SystemNotificationService systemNotificationService) {
        this.claimRecordRepository = claimRecordRepository;
        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.systemConfigService = systemConfigService;
        this.systemNotificationService = systemNotificationService;
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
        if (!STATUS_APPROVED.equals(item.getStatus())) {
            throw new IllegalArgumentException("物品已被申请或已匹配");
        }
        ClaimRecord latest = claimRecordRepository.findTopByItemIdAndClaimerIdOrderByCreatedAtDesc(itemId, userId);
        if (latest != null && !"REJECTED".equals(latest.getStatus())) {
            throw new IllegalArgumentException("该物品已提交过申请，需等待审核结果");
        }
        if (systemConfigService.containsForbiddenWord(java.util.List.of(message == null ? "" : message, proof == null ? "" : proof))) {
            throw new IllegalArgumentException("信息包含违禁词，请重新发布");
        }
        ClaimRecord record = new ClaimRecord();
        record.setItem(item);
        record.setClaimer(user);
        record.setMessage(message);
        record.setProof(proof);
        record.setImageUrls(imageUrls);
        ClaimRecord saved = claimRecordRepository.save(record);
        sendBizNotice(userId,
            claimNoticeObject(item),
            "申请提交",
            safeStatus(saved.getStatus()),
            "你已提交认领申请");
        refreshItemStatusByClaims(item);
        return saved;
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
        String beforeStatus = record.getStatus();

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
        ClaimRecord saved = claimRecordRepository.save(record);
        if (!beforeStatus.equals(saved.getStatus())) {
            sendBizNotice(saved.getClaimer() != null ? saved.getClaimer().getId() : null,
                    claimNoticeObject(saved.getItem()),
                    "申请状态变更",
                    safeStatus(saved.getStatus()),
                    String.format("状态由 %s 变更为 %s", safeStatus(beforeStatus), safeStatus(saved.getStatus())));
        }
        refreshItemStatusByClaims(record.getItem());
        return saved;
    }

    private void refreshItemStatusByClaims(LostItem item) {
        if (item == null || item.getId() == null) return;
        if (STATUS_CLAIMED.equals(item.getStatus())) return;
        String oldStatus = item.getStatus();

        List<ClaimRecord> claims = claimRecordRepository.findByItemIdOrderByCreatedAtDesc(item.getId());
        boolean hasApproved = claims.stream().anyMatch(c -> "APPROVED".equals(c.getStatus()));
        boolean hasAdminApproved = claims.stream().anyMatch(c -> "ADMIN_APPROVED".equals(c.getStatus()));
        boolean hasPending = claims.stream().anyMatch(c -> "PENDING".equals(c.getStatus()));

        if (hasApproved) {
            item.setStatus(STATUS_MATCHED);
        } else if (hasAdminApproved) {
            item.setStatus(STATUS_CLAIM_OWNER_REVIEW);
        } else if (hasPending) {
            item.setStatus(STATUS_CLAIM_ADMIN_REVIEW);
        } else {
            item.setStatus(STATUS_APPROVED);
        }
        LostItem saved = lostItemRepository.save(item);
        if (!safeStatus(oldStatus).equals(safeStatus(saved.getStatus())) && saved.getCreator() != null) {
            String event = "状态变更";
            String detail = String.format("状态由 %s 变更为 %s", safeStatus(oldStatus), safeStatus(saved.getStatus()));
            sendBizNotice(saved.getCreator().getId(),
                postNoticeObject(saved),
                event,
                safeStatus(saved.getStatus()),
                detail);
            notifyClaimTrackers(saved, claims, event, detail);
        }
    }

    private void notifyClaimTrackers(LostItem item, List<ClaimRecord> claims, String event, String detail) {
        if (item == null || claims == null || claims.isEmpty()) return;
        Long ownerId = item.getCreator() != null ? item.getCreator().getId() : null;
        java.util.Set<Long> notified = new java.util.HashSet<>();
        for (ClaimRecord claim : claims) {
            if (claim == null || claim.getClaimer() == null || claim.getClaimer().getId() == null) continue;
            if (!"APPROVED".equals(claim.getStatus())) continue;
            Long claimerId = claim.getClaimer().getId();
            if (ownerId != null && ownerId.equals(claimerId)) continue;
            if (!notified.add(claimerId)) continue;
            sendBizNotice(claimerId,
                    postNoticeObject(item),
                    event,
                    item.getStatus() == null ? "未知状态" : safeStatus(item.getStatus()),
                    detail);
        }
    }

    @Override
    public List<ClaimRecord> myMatchedChats(Long userId) {
        return claimRecordRepository.findApprovedChatClaimsForUser(userId);
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
    public ChatMessage sendMessage(Long userId, Long claimId, Long peerId, String content) {
        ClaimRecord claim = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请记录不存在"));
        if (claim.getItem() != null && "ARCHIVED".equals(claim.getItem().getStatus())) {
            throw new IllegalArgumentException("该帖子已归档，无法继续聊天");
        }
        if (!"APPROVED".equals(claim.getStatus())) {
            throw new IllegalArgumentException("只有已通过的申请才能聊天");
        }
        if (peerId == null) {
            throw new IllegalArgumentException("聊天对象不能为空");
        }
        if (userId.equals(peerId)) {
            throw new IllegalArgumentException("不能给自己发送消息");
        }
        if (!isClaimParticipant(claim, userId) || !isClaimParticipant(claim, peerId)) {
            throw new IllegalArgumentException("无权发送消息");
        }
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        User receiver = userRepository.findById(peerId)
                .orElseThrow(() -> new IllegalArgumentException("聊天对象不存在"));
        ChatMessage msg = new ChatMessage();
        msg.setClaim(claim);
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setContent(content);
        return chatMessageRepository.save(msg);
    }

    @Override
    public List<ChatMessage> getMessages(Long userId, Long claimId, Long peerId) {
        ClaimRecord claim = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请记录不存在"));
        if (claim.getItem() != null && "ARCHIVED".equals(claim.getItem().getStatus())) {
            throw new IllegalArgumentException("该帖子已归档，聊天记录不可查看");
        }
        if (peerId == null) {
            throw new IllegalArgumentException("聊天对象不能为空");
        }
        if (!isClaimParticipant(claim, userId) || !isClaimParticipant(claim, peerId)) {
            throw new IllegalArgumentException("无权查看消息");
        }
        return chatMessageRepository.findDirectMessagesByClaimAndUsers(claimId, userId, peerId);
    }

    private boolean isClaimParticipant(ClaimRecord claim, Long userId) {
        if (claim == null || userId == null) return false;
        boolean isClaimer = claim.getClaimer() != null && claim.getClaimer().getId().equals(userId);
        boolean isOwner = claim.getItem() != null && claim.getItem().getCreator() != null
                && claim.getItem().getCreator().getId().equals(userId);
        boolean isReviewer = claim.getReviewer() != null && claim.getReviewer().getId().equals(userId);
        return isClaimer || isOwner || isReviewer;
    }

    private void sendUserNotice(Long userId, String content) {
        if (userId == null || content == null || content.isBlank()) return;
        systemNotificationService.send(userId, userId, "USER", content);
    }

    private void sendBizNotice(Long userId, String object, String event, String state, String detail) {
        sendUserNotice(userId,
                String.format("【系统通知】对象：%s；事件：%s；状态：%s；说明：%s。",
                        safeText(object), safeText(event), safeText(state), safeText(detail)));
    }

    private String safeTitle(LostItem item) {
        return item == null || item.getTitle() == null || item.getTitle().isBlank() ? "未命名帖子" : item.getTitle();
    }

    private String postNoticeObject(LostItem item) {
        String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
        return postTypeLabel(item) + "《" + safeTitle(item) + "》#" + id;
    }

    private String claimNoticeObject(LostItem item) {
        String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
        String label = item != null && "LOST".equals(item.getType()) ? "归还申请" : "认领申请";
        return label + "《" + safeTitle(item) + "》#" + id;
    }

    private String postTypeLabel(LostItem item) {
        return item != null && "LOST".equals(item.getType()) ? "寻物启事" : "失物招领";
    }

    private String safeStatus(String status) {
        if (status == null || status.isBlank()) return "未知状态";
        return switch (status) {
            case "PENDING" -> "待审核";
            case "ADMIN_APPROVED" -> "待发布者审核";
            case "CLAIM_ADMIN_REVIEW" -> "管理员审核申请中";
            case "CLAIM_OWNER_REVIEW" -> "发布人审核申请中";
            case "APPROVED" -> "已通过";
            case "REJECTED" -> "已驳回";
            case "MATCHED" -> "已匹配";
            case "CLAIMED" -> "已认领";
            case "ARCHIVED" -> "已归档";
            case "CANCELLED" -> "已取消";
            case "ADMIN_DELETED" -> "管理员删除";
            default -> status;
        };
    }

    private String safeText(String text) {
        return text == null || text.isBlank() ? "无" : text;
    }
}
