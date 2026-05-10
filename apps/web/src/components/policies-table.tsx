"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Masked data for KDPA compliance
const initialData = [
  {
    id: "POL-8A92B",
    phone: "254712***678",
    type: "Maize Crop Protection",
    premium: "KSh 150",
    status: "Active",
  },
  {
    id: "POL-3C44F",
    phone: "254722***101",
    type: "Bodaboda P.A.",
    premium: "KSh 50",
    status: "Active",
  },
  {
    id: "POL-9D11A",
    phone: "254733***444",
    type: "Fertilizer Insurance",
    premium: "KSh 200",
    status: "Pending",
  },
  {
    id: "POL-5E77X",
    phone: "254799***888",
    type: "Livestock Cover",
    premium: "KSh 300",
    status: "Active",
  },
];

export function PoliciesTable() {
  // By putting the data directly in useState, we avoid the "cascading render" warning
  const [policies] = useState(initialData);

  return (
    <div className="rounded-md border bg-white mt-8 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Policy ID</TableHead>
            <TableHead>Client Phone</TableHead>
            <TableHead>Coverage Type</TableHead>
            <TableHead>Weekly Premium</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow
              key={policy.id}
              className="hover:bg-slate-50 transition-colors"
            >
              <TableCell className="font-medium text-slate-700">
                {policy.id}
              </TableCell>
              <TableCell className="font-mono text-sm text-slate-600">
                {policy.phone}
              </TableCell>
              <TableCell>{policy.type}</TableCell>
              <TableCell className="font-semibold">{policy.premium}</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="secondary"
                  className={
                    policy.status === "Active"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                  }
                >
                  {policy.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
