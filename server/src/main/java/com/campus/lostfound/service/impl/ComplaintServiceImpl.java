package com.campus.lostfound.service.impl;

import com.campus.lostfound.model.ComplaintRecord;
import com.campus.lostfound.model.ClaimRecord;
import com.campus.lostfound.model.ChatMessage;
import com.campus.lostfound.model.LostItem;
import com.campus.lostfound.model.User;
import com.campus.lostfound.repository.ClaimRecordRepository;
import com.campus.lostfound.repository.ChatMessageRepository;
import com.campus.lostfound.repository.ComplaintRecordRepository;
import com.campus.lostfound.repository.LostItemRepository;
import com.campus.lostfound.repository.UserRepository;
import com.campus.lostfound.service.ComplaintService;
import com.campus.lostfound.service.SystemNotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRecordRepository complaintRecordRepository;
    private final LostItemRepository lostItemRepository;
    private final ClaimRecordRepository claimRecordRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SystemNotificationService systemNotificationService;

    public ComplaintServiceImpl(ComplaintRecordRepository complaintRecordRepository,
                                LostItemRepository lostItemRepository,
                                ClaimRecordRepository claimRecordRepository,
                                ChatMessageRepository chatMessageRepository,
                                UserRepository userRepository,
                                SystemNotificationService systemNotificationService) {
        this.complaintRecordRepository = complaintRecordRepository;
        this.lostItemRepository = lostItemRepository;
        this.claimRecordRepository = claimRecordRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.systemNotificationService = systemNotificationService;
    }

    @Override
    public ComplaintRecord create(Long reporterId, String targetType, Long itemId, Long claimId, Long messageId, String reason, String detail) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        String rawType = targetType == null ? "" : targetType.trim().toUpperCase();
        String type;
        if (!rawType.isEmpty()) {
            type = switch (rawType) {
                case "ITEM", "ITEM_POST" -> "ITEM_POST";
                case "CLAIM", "CLAIM_APPLICATION" -> "CLAIM_APPLICATION";
                case "CHAT", "CHAT_MESSAGE" -> "CHAT_MESSAGE";
                default -> throw new IllegalArgumentException("投诉对象类型不合法");
            };
        } else if (messageId != null) {
            type = "CHAT_MESSAGE";
        } else if (claimId != null) {
            type = "CLAIM_APPLICATION";
        } else {
            type = "ITEM_POST";
        }

        LostItem item = null;
        ClaimRecord claim = null;
        ChatMessage chatMessage = null;
        User target;

        if ("ITEM_POST".equals(type)) {
            if (itemId == null) throw new IllegalArgumentException("帖子ID不能为空");
            if (complaintRecordRepository.existsByReporterIdAndComplaintTypeAndItemId(reporterId, type, itemId)) {
                throw new IllegalArgumentException("你已举报过该帖子，请勿重复举报");
            }
            item = lostItemRepository.findById(itemId)
                    .orElseThrow(() -> new IllegalArgumentException("帖子不存在"));
            target = item.getCreator();
            if (target == null) throw new IllegalArgumentException("被投诉用户不存在");
            if (target.getId().equals(reporterId)) {
                throw new IllegalArgumentException("不能投诉自己发布的帖子");
            }
        } else if ("CLAIM_APPLICATION".equals(type)) {
            if (claimId == null) throw new IllegalArgumentException("申请ID不能为空");
            if (complaintRecordRepository.existsByReporterIdAndComplaintTypeAndClaimId(reporterId, type, claimId)) {
                throw new IllegalArgumentException("你已举报过该申请，请勿重复举报");
            }
            claim = claimRecordRepository.findById(claimId)
                    .orElseThrow(() -> new IllegalArgumentException("申请不存在"));
            if ("APPROVED".equals(claim.getStatus())) {
                throw new IllegalArgumentException("已通过发布人审核的申请不支持举报");
            }
            item = claim.getItem();
            if (item == null || item.getCreator() == null || !item.getCreator().getId().equals(reporterId)) {
                throw new IllegalArgumentException("仅帖子发布者可投诉该申请");
            }
            target = claim.getClaimer();
            if (target == null) throw new IllegalArgumentException("被投诉用户不存在");
            if (target.getId().equals(reporterId)) {
                throw new IllegalArgumentException("不能投诉自己的申请");
            }
        } else {
            if (messageId == null) throw new IllegalArgumentException("聊天消息ID不能为空");
            if (complaintRecordRepository.existsByReporterIdAndComplaintTypeAndChatMessageId(reporterId, type, messageId)) {
                throw new IllegalArgumentException("你已举报过该聊天消息，请勿重复举报");
            }
            chatMessage = chatMessageRepository.findById(messageId)
                    .orElseThrow(() -> new IllegalArgumentException("聊天消息不存在"));
            claim = chatMessage.getClaim();
            if (claim == null) throw new IllegalArgumentException("聊天消息关联申请不存在");
            item = claim.getItem();
            if (!isClaimParticipant(claim, reporterId)) {
                throw new IllegalArgumentException("无权投诉该聊天消息");
            }
            target = chatMessage.getSender();
            if (target == null) throw new IllegalArgumentException("被投诉用户不存在");
            if (target.getId().equals(reporterId)) {
                throw new IllegalArgumentException("不能投诉自己的发言");
            }
        }

        ComplaintRecord record = new ComplaintRecord();
        record.setItem(item);
        record.setClaim(claim);
        record.setChatMessage(chatMessage);
        record.setReporter(reporter);
        record.setTarget(target);
        record.setComplaintType(type);
        record.setReason(reason);
        record.setDetail(detail);
        record.setStatus("PENDING");
        ComplaintRecord saved = complaintRecordRepository.save(record);
        String targetName = safeText(target != null ? target.getUsername() : "-");
        String baseReason = String.format("原因：%s；被举报人：%s", safeText(reason), targetName);
        sendComplaintNotice(reporterId,
            complaintTargetObject(saved),
            "举报提交",
            "已提交",
            baseReason);
        sendComplaintNotice(target != null ? target.getId() : null,
            complaintTargetObject(saved),
            "被举报提醒",
            "待处理",
            String.format("你收到一条新的举报，原因：%s；被举报人：%s", safeText(reason), targetName));
        return saved;
    }

    @Override
    public Page<ComplaintRecord> list(String status, int page, int size) {
        String s = status == null ? "" : status.trim();
        if (s.isEmpty() || "ALL".equalsIgnoreCase(s)) {
            return complaintRecordRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        }
        return complaintRecordRepository.findByStatusOrderByCreatedAtDesc(s.toUpperCase(), PageRequest.of(page, size));
    }

    @Override
    public ComplaintRecord resolve(Long handlerId, Long complaintId, String action) {
        ComplaintRecord record = complaintRecordRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("投诉记录不存在"));
        User handler = userRepository.findById(handlerId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        Long itemId = record.getItem() != null ? record.getItem().getId() : null;
        String act = action == null ? "" : action.trim();
        if (act.isEmpty()) {
            throw new IllegalArgumentException("处理方式不能为空");
        }
        if ("DELETE_ITEM".equals(act)) {
            if ("ITEM_POST".equals(record.getComplaintType())) {
                LostItem complaintItem = record.getItem();
                if (complaintItem != null) {
                    String oldStatus = complaintItem.getStatus();
                    complaintItem.setStatus("ADMIN_DELETED");
                    complaintItem.setRejectReason("内容违规，被举报");
                    lostItemRepository.save(complaintItem);
                    sendComplaintNotice(complaintItem.getCreator() != null ? complaintItem.getCreator().getId() : null,
                            postNoticeObject(complaintItem),
                            "状态变更",
                            statusText("ADMIN_DELETED"),
                            String.format("状态由 %s 变更为 %s；内容违规，被举报", statusText(oldStatus), statusText("ADMIN_DELETED")));
                }
            } else if ("CLAIM_APPLICATION".equals(record.getComplaintType())) {
                ClaimRecord complaintClaim = record.getClaim();
                if (complaintClaim != null) {
                    String oldStatus = complaintClaim.getStatus();
                    complaintClaim.setStatus("REJECTED");
                    complaintClaim.setRejectReason("被他人举报");
                    claimRecordRepository.save(complaintClaim);
                    sendComplaintNotice(complaintClaim.getClaimer() != null ? complaintClaim.getClaimer().getId() : null,
                            claimNoticeObject(complaintClaim.getItem()),
                            "状态变更",
                            statusText("REJECTED"),
                            String.format("状态由 %s 变更为 %s；被他人举报", statusText(oldStatus), statusText("REJECTED")));
                    refreshItemStatusByClaims(complaintClaim.getItem());
                }
            } else if ("CHAT_MESSAGE".equals(record.getComplaintType())) {
                Long messageId = record.getChatMessage() != null ? record.getChatMessage().getId() : null;
                record.setChatMessage(null);
                complaintRecordRepository.save(record);
                if (messageId != null) chatMessageRepository.deleteById(messageId);
            }
        } else if ("BAN_USER".equals(act)) {
            User target = record.getTarget();
            target.setEnabled(false);
            userRepository.save(target);
        } else if ("DELETE_AND_BAN".equals(act)) {
            if ("ITEM_POST".equals(record.getComplaintType())) {
                LostItem complaintItem = record.getItem();
                if (complaintItem != null) {
                    String oldStatus = complaintItem.getStatus();
                    complaintItem.setStatus("ADMIN_DELETED");
                    complaintItem.setRejectReason("内容违规，被举报");
                    lostItemRepository.save(complaintItem);
                    sendComplaintNotice(complaintItem.getCreator() != null ? complaintItem.getCreator().getId() : null,
                            postNoticeObject(complaintItem),
                            "状态变更",
                            statusText("ADMIN_DELETED"),
                            String.format("状态由 %s 变更为 %s；内容违规，被举报", statusText(oldStatus), statusText("ADMIN_DELETED")));
                }
            } else if ("CLAIM_APPLICATION".equals(record.getComplaintType())) {
                ClaimRecord complaintClaim = record.getClaim();
                if (complaintClaim != null) {
                    String oldStatus = complaintClaim.getStatus();
                    complaintClaim.setStatus("REJECTED");
                    complaintClaim.setRejectReason("被他人举报");
                    claimRecordRepository.save(complaintClaim);
                    sendComplaintNotice(complaintClaim.getClaimer() != null ? complaintClaim.getClaimer().getId() : null,
                            claimNoticeObject(complaintClaim.getItem()),
                            "状态变更",
                            statusText("REJECTED"),
                            String.format("状态由 %s 变更为 %s；被他人举报", statusText(oldStatus), statusText("REJECTED")));
                    refreshItemStatusByClaims(complaintClaim.getItem());
                }
            } else if ("CHAT_MESSAGE".equals(record.getComplaintType())) {
                Long messageId = record.getChatMessage() != null ? record.getChatMessage().getId() : null;
                record.setChatMessage(null);
                complaintRecordRepository.save(record);
                if (messageId != null) chatMessageRepository.deleteById(messageId);
            }
            User target = record.getTarget();
            target.setEnabled(false);
            userRepository.save(target);
        } else if (!"WARN".equals(act)) {
            throw new IllegalArgumentException("处理方式不合法");
        }
        record.setStatus("RESOLVED");
        record.setAction(act);
        record.setHandler(handler);
        record.setHandledAt(LocalDateTime.now());
        ComplaintRecord saved = complaintRecordRepository.save(record);
        String actionText = actionText(saved.getAction());
        sendComplaintNotice(saved.getReporter() != null ? saved.getReporter().getId() : null,
            complaintTargetObject(saved),
            "举报处理结果",
            "已处理",
            String.format("处理方式：%s", actionText));
        sendComplaintNotice(saved.getTarget() != null ? saved.getTarget().getId() : null,
            complaintTargetObject(saved),
            "举报处理结果",
            "已处理",
            String.format("你被举报的内容已处理，处理方式：%s", actionText));
        return saved;
    }

    private boolean isClaimParticipant(ClaimRecord claim, Long userId) {
        if (claim == null || userId == null) return false;
        boolean isClaimer = claim.getClaimer() != null && claim.getClaimer().getId().equals(userId);
        boolean isOwner = claim.getItem() != null && claim.getItem().getCreator() != null
                && claim.getItem().getCreator().getId().equals(userId);
        boolean isReviewer = claim.getReviewer() != null && claim.getReviewer().getId().equals(userId);
        return isClaimer || isOwner || isReviewer;
    }

    private void refreshItemStatusByClaims(LostItem item) {
        if (item == null || item.getId() == null) return;
        if ("CLAIMED".equals(item.getStatus())) return;
        String oldStatus = item.getStatus();
        java.util.List<ClaimRecord> claims = claimRecordRepository.findByItemIdOrderByCreatedAtDesc(item.getId());
        boolean hasApproved = claims.stream().anyMatch(c -> "APPROVED".equals(c.getStatus()));
        boolean hasAdminApproved = claims.stream().anyMatch(c -> "ADMIN_APPROVED".equals(c.getStatus()));
        boolean hasPending = claims.stream().anyMatch(c -> "PENDING".equals(c.getStatus()));

        if (hasApproved) item.setStatus("MATCHED");
        else if (hasAdminApproved) item.setStatus("CLAIM_OWNER_REVIEW");
        else if (hasPending) item.setStatus("CLAIM_ADMIN_REVIEW");
        else item.setStatus("APPROVED");

        LostItem saved = lostItemRepository.save(item);
        if (!safeText(oldStatus).equals(safeText(saved.getStatus())) && saved.getCreator() != null) {
            sendComplaintNotice(saved.getCreator().getId(),
                    postNoticeObject(saved),
                    "状态变更",
                    statusText(saved.getStatus()),
                    String.format("状态由 %s 变更为 %s", statusText(oldStatus), statusText(saved.getStatus())));
        }
    }

    @Override
    public ComplaintRecord reject(Long handlerId, Long complaintId) {
        ComplaintRecord record = complaintRecordRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("投诉记录不存在"));
        User handler = userRepository.findById(handlerId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        record.setStatus("REJECTED");
        record.setHandler(handler);
        record.setHandledAt(LocalDateTime.now());
        ComplaintRecord saved = complaintRecordRepository.save(record);
        sendComplaintNotice(saved.getReporter() != null ? saved.getReporter().getId() : null,
            complaintTargetObject(saved),
            "举报处理结果",
            "已驳回",
            "你提交的举报未通过审核");
        sendComplaintNotice(saved.getTarget() != null ? saved.getTarget().getId() : null,
            complaintTargetObject(saved),
            "举报处理结果",
            "已驳回",
            "针对你的举报已被驳回");
        return saved;
    }

    @Override
    public boolean hasChatReported(Long userId, Long claimId, Long peerId) {
        if (claimId == null) throw new IllegalArgumentException("申请ID不能为空");
        if (peerId == null) throw new IllegalArgumentException("聊天对象不能为空");
        ClaimRecord claim = claimRecordRepository.findById(claimId)
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));
        if (!isClaimParticipant(claim, userId) || !isClaimParticipant(claim, peerId)) {
            throw new IllegalArgumentException("无权查看");
        }
        return complaintRecordRepository.existsResolvedPeerChatComplaint(
                claimId, peerId, userId
        );
    }

    private void sendUserNotice(Long userId, String content) {
        if (userId == null || content == null || content.isBlank()) return;
        systemNotificationService.send(userId, userId, "USER", content);
    }

    private void sendComplaintNotice(Long userId, String objectType, String event, String state, String detail) {
        sendUserNotice(userId,
            String.format("【系统通知】对象：%s；事件：%s；状态：%s；说明：%s。",
                        safeText(objectType), safeText(event), safeText(state), safeText(detail)));
    }

    private String complaintTargetObject(ComplaintRecord record) {
        if (record == null) return "申请";
        if ("CHAT_MESSAGE".equals(record.getComplaintType())) {
            Long claimId = record.getClaim() != null ? record.getClaim().getId() : null;
            return claimId == null ? "聊天消息" : "聊天消息#" + claimId;
        }
        if ("CLAIM_APPLICATION".equals(record.getComplaintType())) {
            LostItem item = record.getClaim() != null ? record.getClaim().getItem() : record.getItem();
            String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
            String label = item != null && "LOST".equals(item.getType()) ? "归还申请" : "认领申请";
            return label + "《" + safeTitle(item) + "》#" + id;
        }
        LostItem item = record.getItem();
        String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
        String label = item != null && "LOST".equals(item.getType()) ? "寻物启事" : "失物招领";
        return label + "《" + safeTitle(item) + "》#" + id;
    }

    private String safeText(String text) {
        return text == null || text.isBlank() ? "无" : text;
    }

    private String postNoticeObject(LostItem item) {
        String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
        String label = item != null && "LOST".equals(item.getType()) ? "寻物启事" : "失物招领";
        return label + "《" + safeTitle(item) + "》#" + id;
    }

    private String claimNoticeObject(LostItem item) {
        String id = item != null && item.getId() != null ? String.valueOf(item.getId()) : "0";
        String label = item != null && "LOST".equals(item.getType()) ? "归还申请" : "认领申请";
        return label + "《" + safeTitle(item) + "》#" + id;
    }

    private String actionText(String action) {
        if ("DELETE_ITEM".equals(action)) return "删除内容";
        if ("BAN_USER".equals(action)) return "封禁用户";
        if ("DELETE_AND_BAN".equals(action)) return "删除内容并封禁用户";
        if ("WARN".equals(action)) return "警告";
        return safeText(action);
    }

    private String statusText(String status) {
        if ("PENDING".equals(status)) return "待审核";
        if ("ADMIN_APPROVED".equals(status)) return "待发布者审核";
        if ("CLAIM_ADMIN_REVIEW".equals(status)) return "管理员审核申请中";
        if ("CLAIM_OWNER_REVIEW".equals(status)) return "发布人审核申请中";
        if ("APPROVED".equals(status)) return "未匹配";
        if ("REJECTED".equals(status)) return "已驳回";
        if ("MATCHED".equals(status)) return "已匹配";
        if ("CLAIMED".equals(status)) return "已认领";
        if ("ARCHIVED".equals(status)) return "已归档";
        if ("CANCELLED".equals(status)) return "已取消";
        if ("ADMIN_DELETED".equals(status)) return "管理员删除";
        return safeText(status);
    }

    private String safeTitle(LostItem item) {
        return item == null || item.getTitle() == null || item.getTitle().isBlank() ? "未命名帖子" : item.getTitle();
    }
}
