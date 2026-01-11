package com.eauction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class AuctionCreateDto {
    @NotBlank
    private String productName;
    @NotBlank
    private String category;
    @NotBlank
    private String description;
    @NotBlank
    private String condition;
    @NotNull
    @Positive
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
