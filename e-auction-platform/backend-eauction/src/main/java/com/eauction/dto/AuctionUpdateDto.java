package com.eauction.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class AuctionUpdateDto {
    private String productName;
    private String category;
    private String description;
    private String condition;
    private Double startingPrice;
    private Double minIncrement;
    private Double buyNowPrice;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean autoExtend;
    private String imageUrl;
    private List<String> imageUrls;
    private Boolean enabled;
}
