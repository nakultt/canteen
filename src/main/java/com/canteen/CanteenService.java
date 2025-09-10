package com.canteen;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CanteenService {
    private List<MealRequest> requests = new ArrayList<>();

    public void addRequest(MealRequest request) {
        requests.add(request);
    }

    public Map<MealType, Integer> getMealCountsForDate(LocalDate date) {
        Map<MealType, Integer> counts = new HashMap<>();
        for (MealRequest request : requests) {
            if (request.getDate().equals(date)) {
                MealType type = request.getMealType();
                counts.put(type, counts.getOrDefault(type, 0) + 1);
            }
        }
        return counts;
    }

    public List<MealRequest> getAllRequests() {
        return new ArrayList<>(requests);
    }
}
