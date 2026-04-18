package com.unicore.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MostBookedResourceResponse {

    private String facilityId;

    private String facilityName;

    private long bookingCount;
}