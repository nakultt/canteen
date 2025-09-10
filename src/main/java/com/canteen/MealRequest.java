package com.canteen;

import java.time.LocalDate;

public class MealRequest {
    private Employee employee;
    private MealType mealType;
    private LocalDate date;

    public MealRequest(Employee employee, MealType mealType, LocalDate date) {
        this.employee = employee;
        this.mealType = mealType;
        this.date = date;
    }

    public Employee getEmployee() {
        return employee;
    }

    public MealType getMealType() {
        return mealType;
    }

    public LocalDate getDate() {
        return date;
    }

    @Override
    public String toString() {
        return "MealRequest{" +
                "employee=" + employee +
                ", mealType=" + mealType +
                ", date=" + date +
                '}';
    }
}
