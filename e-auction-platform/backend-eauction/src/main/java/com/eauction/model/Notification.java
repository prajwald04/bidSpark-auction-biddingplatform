package com.eauction.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Column;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Notification {
    @Id
    @GeneratedValue
    private Long id;
    private String message;
    private String type;
    @Column(name = "is_read")
    private boolean read;
    private LocalDateTime createdAt;
    @ManyToOne
    private User user;
}
