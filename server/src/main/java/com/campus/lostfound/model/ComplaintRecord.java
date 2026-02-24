package com.campus.lostfound.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_records")
public class ComplaintRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id")
    private LostItem item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "target_id", nullable = false)
    private User target;

    @Column(nullable = false, length = 30)
    private String complaintType = "ITEM_POST";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "claim_id")
    private ClaimRecord claim;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "chat_message_id")
    private ChatMessage chatMessage;

    @Column(nullable = false, length = 60)
    private String reason;

    @Column(length = 500)
    private String detail;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(length = 50)
    private String action;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "handler_id")
    private User handler;

    private LocalDateTime handledAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public LostItem getItem() { return item; }
    public void setItem(LostItem item) { this.item = item; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public User getTarget() { return target; }
    public void setTarget(User target) { this.target = target; }
    public String getComplaintType() { return complaintType; }
    public void setComplaintType(String complaintType) { this.complaintType = complaintType; }
    public ClaimRecord getClaim() { return claim; }
    public void setClaim(ClaimRecord claim) { this.claim = claim; }
    public ChatMessage getChatMessage() { return chatMessage; }
    public void setChatMessage(ChatMessage chatMessage) { this.chatMessage = chatMessage; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public User getHandler() { return handler; }
    public void setHandler(User handler) { this.handler = handler; }
    public LocalDateTime getHandledAt() { return handledAt; }
    public void setHandledAt(LocalDateTime handledAt) { this.handledAt = handledAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
