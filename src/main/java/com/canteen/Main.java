package com.canteen;

import java.time.LocalDate;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        // Create some employees
        Employee emp1 = new Employee("001", "Alice");
        Employee emp2 = new Employee("002", "Bob");
        Employee emp3 = new Employee("003", "Charlie");

        // Create canteen service
        CanteenService service = new CanteenService();

        // Employees request meals for today
        LocalDate today = LocalDate.now();
        service.addRequest(new MealRequest(emp1, MealType.BREAKFAST, today));
        service.addRequest(new MealRequest(emp1, MealType.LUNCH, today));
        service.addRequest(new MealRequest(emp2, MealType.LUNCH, today));
        service.addRequest(new MealRequest(emp2, MealType.DINNER, today));
        service.addRequest(new MealRequest(emp3, MealType.BREAKFAST, today));
        service.addRequest(new MealRequest(emp3, MealType.DINNER, today));

        // Get meal counts for today
        Map<MealType, Integer> counts = service.getMealCountsForDate(today);

        System.out.println("Meal counts for " + today + ":");
        for (MealType type : MealType.values()) {
            System.out.println(type + ": " + counts.getOrDefault(type, 0));
        }

        // Print all requests
        System.out.println("\nAll requests:");
        for (MealRequest request : service.getAllRequests()) {
            System.out.println(request);
        }
    }
}
