package com.eauction.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Bid {
    @Id
    @GeneratedValue
    private Long id;
    private double amount;
    private LocalDateTime bidTime;

    @ManyToOne
    private Auction auction;

    @ManyToOne
    private User bidder;
}
