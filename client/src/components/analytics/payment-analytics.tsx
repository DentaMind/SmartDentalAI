
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Payment } from "@shared/schema";

export function PaymentAnalytics() {
  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const monthlyData = payments?.reduce((acc, payment) => {
    const month = new Date(payment.paymentDate).getMonth();
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<number, number>);

  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      label: "Monthly Revenue",
      data: Array.from({ length: 12 }, (_, i) => monthlyData?.[i] || 0),
      backgroundColor: "rgba(54, 162, 235, 0.5)",
      borderColor: "rgb(54, 162, 235)",
      borderWidth: 1
    }]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Bar 
          data={data}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Amount ($)"
                }
              }
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
