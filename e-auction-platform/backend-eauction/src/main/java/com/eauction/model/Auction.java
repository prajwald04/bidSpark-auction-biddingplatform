package com.eauction.model;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@jakarta.persistence.Table(indexes = {
        @jakarta.persistence.Index(name = "idx_status_time", columnList = "status,startTime,endTime")
})
@Getter
@Setter
public class Auction {
    @Id
    @GeneratedValue
    private Long id;
    private String productName;
    private String category;
    private String description;
    @Column(name = "item_condition")
    private String condition;
    private double startingPrice;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean enabled = true;
    private Double currentBid;
    private Integer bidCount;
    private Double minIncrement;
    private Double buyNowPrice;
    private Boolean autoExtend;
    private String status;

    @ManyToOne
    private User seller;

    @ManyToOne
    private User highestBidder;

    @Column(length = 2048)
    private String imageUrl;
    @ElementCollection
    @Column(name = "image_urls", length = 2048)
    private List<String> imageUrls;
}
