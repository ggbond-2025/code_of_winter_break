package com.campus.lostfound.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claim_records")
public class ClaimRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private LostItem item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "claimer_id", nullable = false)
    private User claimer;

    /** 审核通过该认领的管理员（可参与聊天） */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 500)
    private String proof;

    @Column(length = 1000)
    private String imageUrls;

    /** PENDING / ADMIN_APPROVED / APPROVED / REJECTED */
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(length = 300)
    private String rejectReason;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public LostItem getItem() { return item; }
    public void setItem(LostItem item) { this.item = item; }
    public User getClaimer() { return claimer; }
    public void setClaimer(User claimer) { this.claimer = claimer; }
    public User getReviewer() { return reviewer; }
    public void setReviewer(User reviewer) { this.reviewer = reviewer; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getProof() { return proof; }
    public void setProof(String proof) { this.proof = proof; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
    public String getImageUrls() { return imageUrls; }
    public void setImageUrls(String imageUrls) { this.imageUrls = imageUrls; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
