-- CreateEnum
CREATE TYPE "public"."employee_role" AS ENUM ('customer', 'super_admin', 'outlet_admin', 'driver', 'worker');

-- CreateEnum
CREATE TYPE "public"."attendance_status" AS ENUM ('present', 'absent', 'late', 'early_leave', 'on_leave', 'sick', 'holiday');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('waiting_for_confirmation', 'waiting_for_driver_pickup', 'on_the_way_to_outlet', 'arrived_at_outlet', 'washing_in_progress', 'ironing_in_progress', 'packing_in_progress', 'waiting_for_payment', 'ready_for_delivery', 'out_for_delivery', 'delivered_to_customer');

-- CreateEnum
CREATE TYPE "public"."payment_method" AS ENUM ('cash', 'debit', 'credit', 'bank_transfer', 'qris', 'e_wallet');

-- CreateEnum
CREATE TYPE "public"."station" AS ENUM ('washing', 'ironing', 'packing', 'qa', 'admin');

-- CreateEnum
CREATE TYPE "public"."payment_status" AS ENUM ('waiting', 'paid', 'failed', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "public"."task_status" AS ENUM ('pending', 'assigned', 'in_progress', 'on_hold', 'done', 'cancelled', 'rejected', 'request_bypass');

-- CreateEnum
CREATE TYPE "public"."label" AS ENUM ('HOME', 'OFFICE', 'APARTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."oauth_provider" AS ENUM ('google', 'facebook', 'twitter', 'apple', 'github', 'other');

-- CreateEnum
CREATE TYPE "public"."PickupStatus" AS ENUM ('WAITING_FOR_DRIVER', 'ON_THE_WAY_TO_CUSTOMER', 'ON_THE_WAY_TO_OUTLET', 'RECEIVED_BY_OUTLET');

-- CreateEnum
CREATE TYPE "public"."DeilveryStatus" AS ENUM ('NOT_READY_TO_DELIVER', 'WAITING_FOR_DRIVER', 'ON_THE_WAY_TO_OUTLET', 'ON_THE_WAY_TO_CUSTOMER', 'RECEIVED_BY_CUSTOMER');

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "role" "public"."employee_role" NOT NULL DEFAULT 'customer',
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone_number" TEXT,
    "photo_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_provider" "public"."oauth_provider",
    "reset_password_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "label" "public"."label" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "role" "public"."employee_role" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "reset_password_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_stations" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "station" "public"."station" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."worker_tasks" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "order_header_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "work_station_id" TEXT NOT NULL,
    "status" "public"."task_status" NOT NULL DEFAULT 'pending',
    "itemQty" INTEGER,
    "itemUnit" TEXT,
    "bypassReqNote" TEXT,
    "bypassReq" BOOLEAN DEFAULT false,
    "is_req_aprooved" BOOLEAN DEFAULT false,
    "item_passed" TEXT,
    "assigned_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "worker_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pickup_tasks" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "customer_address_id" TEXT NOT NULL,
    "assigned_by_admin_id" TEXT NOT NULL,
    "order_header_id" TEXT NOT NULL,
    "status" "public"."PickupStatus" NOT NULL DEFAULT 'WAITING_FOR_DRIVER',
    "distance" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pickup_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."delivery_tasks" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "customer_address_id" TEXT NOT NULL,
    "assigned_by_admin_id" TEXT NOT NULL,
    "order_header_id" TEXT NOT NULL,
    "status" "public"."DeilveryStatus" NOT NULL,
    "distance" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "delivery_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "public"."attendance_status" NOT NULL,
    "clock_in_at" TIMESTAMP(3),
    "clock_out_at" TIMESTAMP(3),
    "work_minutes" INTEGER,
    "late_minutes" INTEGER,
    "early_leave_min" INTEGER,
    "notes" TEXT,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outlets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "coverage_area" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outlet_schedules" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "detail_days" TEXT NOT NULL,
    "open_hour" TIMESTAMP(3) NOT NULL,
    "close_hour" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "outlet_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "service_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "min_qty" INTEGER NOT NULL,
    "eta_hours" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_headers" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "handled_by_id" TEXT,
    "outlet_id" TEXT NOT NULL,
    "status" "public"."order_status" NOT NULL DEFAULT 'waiting_for_confirmation',
    "notes" TEXT NOT NULL,
    "pickup_at" TIMESTAMP(3) NOT NULL,
    "deliver_at" TIMESTAMP(3) NOT NULL,
    "est_hours" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "order_header_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "sub_total" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "order_header_id" TEXT NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."payment_status" NOT NULL DEFAULT 'waiting',
    "provider_ref" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_stations" ADD CONSTRAINT "work_stations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_order_header_id_fkey" FOREIGN KEY ("order_header_id") REFERENCES "public"."order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_tasks" ADD CONSTRAINT "worker_tasks_work_station_id_fkey" FOREIGN KEY ("work_station_id") REFERENCES "public"."work_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_tasks" ADD CONSTRAINT "pickup_tasks_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_tasks" ADD CONSTRAINT "pickup_tasks_assigned_by_admin_id_fkey" FOREIGN KEY ("assigned_by_admin_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_tasks" ADD CONSTRAINT "pickup_tasks_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_tasks" ADD CONSTRAINT "pickup_tasks_customer_address_id_fkey" FOREIGN KEY ("customer_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pickup_tasks" ADD CONSTRAINT "pickup_tasks_order_header_id_fkey" FOREIGN KEY ("order_header_id") REFERENCES "public"."order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_tasks" ADD CONSTRAINT "delivery_tasks_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_tasks" ADD CONSTRAINT "delivery_tasks_assigned_by_admin_id_fkey" FOREIGN KEY ("assigned_by_admin_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_tasks" ADD CONSTRAINT "delivery_tasks_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_tasks" ADD CONSTRAINT "delivery_tasks_customer_address_id_fkey" FOREIGN KEY ("customer_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."delivery_tasks" ADD CONSTRAINT "delivery_tasks_order_header_id_fkey" FOREIGN KEY ("order_header_id") REFERENCES "public"."order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outlet_schedules" ADD CONSTRAINT "outlet_schedules_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_headers" ADD CONSTRAINT "order_headers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_headers" ADD CONSTRAINT "order_headers_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_headers" ADD CONSTRAINT "order_headers_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_header_id_fkey" FOREIGN KEY ("order_header_id") REFERENCES "public"."order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_order_header_id_fkey" FOREIGN KEY ("order_header_id") REFERENCES "public"."order_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
