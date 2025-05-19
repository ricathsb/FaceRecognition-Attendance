"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceCardProps } from "@/lib/types";
import { format } from "date-fns";

export function AttendanceCard({ data, onReset }: AttendanceCardProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto"
      >
        <Card className="border-2 border-blue-200 bg-white shadow-md">
          <CardHeader className="pb-2 text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl text-blue-800">Attendance Marked!</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Student Name</p>
                <p className="text-lg font-semibold">{data.nama || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Student ID</p>
                <p className="text-lg font-mono">{data.nim || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {data.timestamp
                    ? format(new Date(data.timestamp), "PPpp")
                    : "Timestamp not available"}
                </p>
              </div>
              {data.image && (
                <div className="mt-4">
                  <img src={data.image} alt="Attendance capture" className="w-full h-auto rounded-lg border border-gray-200" />

                </div>
              )}
              <div className="pt-2">
                <p className="text-center text-green-600 font-medium">{data.message || ''}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={onReset}
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            >
              Mark Another Attendance
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
