import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { ScrollBar } from "./ui/scroll-area";

export const SalesInvoice = ({ order }) => {
  if (!order) return <p>Loading invoice...</p>

  const { invoice, created_at, customer, items, totals, coupon } = order
  const formattedDate = new Date(created_at).toLocaleDateString()

  const formatCurrency = (amount) =>
    `₱${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    })}`


  // Has coupon?
  const hasCoupon =
    (coupon?.itemsDiscount || 0) > 0 ||
    (coupon?.shippingDiscount || 0) > 0 ||
    !!coupon?.id ||
    !!coupon?.label ||
    !!coupon?.deal;


  const totalDue = totals.revenue + totals.shipping



  return (
    <main className="w-full flex justify-center mt-5">
      <div className="w-[15.2rem] h-[auto] relative">
        <div className="flex flex-col w-[15rem] ">
          <p className="text-[10px]">
            <strong>SPLND'D ClOTHING SHOP</strong>
          </p>
          {/* <p className="text-[12px]">
            <strong>Clarissa Arriola De Leon - Prop.</strong>
          </p> */}
          <p className="text-[8px]">NON VAT REG. TIN: 613-754-852-000000</p>
          {/* <p className="text-[12px]">
            BLK.7 LOT 5, Sunflower St.,Capitol Park Homes 2
          </p> */}
          <p className="text-[8px]">Barangay 179, 1400 City of Caloocan</p>
          <p className="text-[8px]">NCR, THIRD District, Philippines</p>
        </div>
        <div className="h-[auto] w-[8rem] absolute top-3.5 right-0 p-1">
          <p className="tracking-[2px] text-right">
            <strong>
              SALES <br />
              INVOICE
            </strong>
          </p>
          <p className="mt-[1px] flex gap-2">
            <strong className="text-[8px]">NO:</strong>
            <span className="tracking-[6px] text-[8px] text-red-400">
              {invoice}
            </span>
          </p>
          <p className="border border-black h-[1rem] ">
            <span className="text-[10px] absolute ">Date: {formattedDate}</span>
          </p>
        </div>

        <div className="border border-black mt-[2.7rem] w-[15rem] h-[auto] min-h-[10rem] ">
          <p className="border border-b-black text-[8px]">SOLD TO :  {customer.contact}</p>
          <ScrollArea className="h-[10rem] w-full">
            <Table className="min-w-[15rem]"> {/* make table wider than container to trigger horizontal scroll */}
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[8px]">Item Description</TableHead>
                  <TableHead className="text-[8px]">Qty.</TableHead>
                  <TableHead className="text-[8px]">Unit Price</TableHead>
                  <TableHead className="text-[8px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-[6px]">
                      {item.sku?.replace(/-b\d+$/i, "")}
                    </TableCell>
                    <TableCell className="text-[5px]">{item.quantity}</TableCell>
                    <TableCell className="text-[6px]">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-[6px]">
                      {formatCurrency(item.quantity * item.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" /> {/* 👈 adds horizontal scroll bar */}
            <ScrollBar orientation="vertical" /> {/* optional — keeps vertical scroll */}
          </ScrollArea>

        </div>

        <div className=" flex">
          <div className="h-[auto] w-[50%] ">
            <p className="text-[8px]">Received in good order and condition.</p>
            {/* <p>
              By: ____________________ <br />
              <span className="text-[9px] ml-5 ">
                Cashier/Authorized Representative
              </span>
            </p> */}
            {/* 🔹 Extra note below */}
            <p className="text-[15px] mt-3 rotate-[-15deg] text-gray-500">
              Virtual Receipt
            </p>
          </div>
          <div className=" h-[auto] w-[49%]">
            <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
              <p className="font-bold text-[8px]">Total Sales:</p>
              <span className="ml-auto text-[8px]">
                {formatCurrency(totals.revenue)}
              </span>
            </div>

            {/* Coupon block (if any) */}
            {hasCoupon && (
              <>
                {(coupon?.label || coupon?.deal) && (
                  <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
                    <p className="text-[8px] font-medium">Coupon:</p>
                    <span className="ml-auto text-[8px]">
                      {coupon.label || coupon.deal}
                    </span>
                  </div>
                )}

                {Number(coupon?.itemsDiscount || 0) > 0 && (
                  <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
                    <p className="text-[8px]">Items Discount:</p>
                    <span className="ml-auto text-[8px]">
                      − {formatCurrency(coupon.itemsDiscount)}
                    </span>
                  </div>
                )}

                {Number(coupon?.shippingDiscount || 0) > 0 && (
                  <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
                    <p className="text-[8px]">Shipping Discount:</p>
                    <span className="ml-auto text-[8px]">
                      − {formatCurrency(coupon.shippingDiscount)}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Shipping (final, after coupon) */}
            <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
              <p className="text-[8px] font-medium">Shipping Fee:</p>
              <span className="ml-auto text-[8px]">
                {formatCurrency(totals.shipping)}
              </span>
            </div>
            {/* <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
              <p className="text-[8px]">
                less:Discount <br />
                (SC/PWD/NAAC/MOV/SP)
              </p>
              <span className="ml-auto text-[13px] "></span>
            </div> */}
            {/* <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
              <p className="text-[8px]">Less: Withholding Tax</p>
              <span className="ml-auto text-[13px] "></span>
            </div> */}
            <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
              <p className="text-[8px] font-bold">TOTAL AMOUNT DUE:</p>
              <span className="ml-auto text-[8px]">
                {formatCurrency(totalDue)}
              </span>
            </div>
            {/* <div className="border border-b-black border-l-black border-r-black p-1 flex items-center">
              <p className="text-[10px] text-right">
                SC/PWD/NAAC/MOV/
                <br />
                Solo Parent ID No:
                <br />
                SC/PWD/NAAC/MOV/SP
                <br />
                Signature
              </p>

              <span className="ml-auto text-[13px] tre"></span>
            </div> */}
          </div>
        </div>
      </div>
    </main>
  );
};
