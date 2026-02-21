package com.campus.lostfound.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_notifications")
public class SystemNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "target_id")
    private User target;

    @Column(nullable = false, length = 20)
    private String scope = "ALL";

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public User getTarget() { return target; }
    public void setTarget(User target) { this.target = target; }
    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
