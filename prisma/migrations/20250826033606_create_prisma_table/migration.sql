-- CreateEnum
CREATE TYPE "public"."employee_role" AS ENUM ('super_admin', 'outlet_admin', 'driver', 'worker');

-- CreateEnum
CREATE TYPE "public"."attendance_status" AS ENUM ('present', 'absent', 'late', 'early_leave', 'on_leave', 'sick', 'holiday');

-- CreateEnum
CREATE TYPE "public"."leave_type" AS ENUM ('sick', 'annual', 'maternity', 'paternity', 'marriage', 'bereavement', 'unpaid', 'other');

-- CreateEnum
CREATE TYPE "public"."leave_req_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('waiting_for_driver_pickup', 'on_the_way_to_outlet', 'arrived_at_outlet', 'washing_in_progress', 'ironing_in_progress', 'packing_in_progress', 'waiting_for_payment', 'ready_for_delivery', 'out_for_delivery', 'delivered_to_customer');

-- CreateEnum
CREATE TYPE "public"."payment_method" AS ENUM ('cash', 'debit', 'credit', 'bank_transfer', 'qris', 'e_wallet');

-- CreateEnum
CREATE TYPE "public"."station" AS ENUM ('washing', 'ironing', 'packing', 'driving_pickup', 'driving_delivery', 'qa', 'admin');

-- CreateEnum
CREATE TYPE "public"."task_status" AS ENUM ('pending', 'assigned', 'in_progress', 'on_hold', 'done', 'cancelled', 'rejected', 'request_bypass');

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
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
    "label" TEXT NOT NULL,
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
    "name" TEXT NOT NULL,
    "service_category_id" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "min_qty" DOUBLE PRECISION NOT NULL,
    "est_hours" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
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
    "coverage_area" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
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
    "open_hour" TEXT NOT NULL,
    "close_hour" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "outlet_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "role" "public"."employee_role" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
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
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "type" "public"."leave_type" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."leave_req_status" NOT NULL DEFAULT 'pending',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_headers" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "outlet_id" TEXT NOT NULL,
    "handled_by_id" TEXT NOT NULL,
    "status" "public"."order_status" NOT NULL,
    "notes" TEXT NOT NULL,
    "pickup_at" TIMESTAMP(3),
    "delivery_at" TIMESTAMP(3),
    "payment_method" "public"."payment_method",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "sub_total" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."worker_stations" (
    "id" TEXT NOT NULL,
    "station" "public"."station" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "worker_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_tasks" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assigned_by_id" TEXT,
    "order_id" TEXT,
    "outlet_id" TEXT NOT NULL,
    "work_station_id" TEXT,
    "type" "public"."station" NOT NULL,
    "status" "public"."task_status" NOT NULL DEFAULT 'pending',
    "start_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "qty" DOUBLE PRECISION,
    "is_approved" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "public"."customer_addresses"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_name_key" ON "public"."service_categories"("name");

-- CreateIndex
CREATE INDEX "services_service_category_id_idx" ON "public"."services"("service_category_id");

-- CreateIndex
CREATE INDEX "outlet_schedules_outlet_id_idx" ON "public"."outlet_schedules"("outlet_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE INDEX "employees_outlet_id_idx" ON "public"."employees"("outlet_id");

-- CreateIndex
CREATE INDEX "employees_shift_id_idx" ON "public"."employees"("shift_id");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_name_key" ON "public"."shifts"("name");

-- CreateIndex
CREATE INDEX "attendances_employee_id_date_idx" ON "public"."attendances"("employee_id", "date");

-- CreateIndex
CREATE INDEX "attendances_outlet_id_idx" ON "public"."attendances"("outlet_id");

-- CreateIndex
CREATE INDEX "attendances_shift_id_idx" ON "public"."attendances"("shift_id");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "public"."leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_outlet_id_idx" ON "public"."leave_requests"("outlet_id");

-- CreateIndex
CREATE INDEX "leave_requests_approved_by_id_idx" ON "public"."leave_requests"("approved_by_id");

-- CreateIndex
CREATE INDEX "order_headers_customer_id_idx" ON "public"."order_headers"("customer_id");

-- CreateIndex
CREATE INDEX "order_headers_outlet_id_idx" ON "public"."order_headers"("outlet_id");

-- CreateIndex
CREATE INDEX "order_headers_handled_by_id_idx" ON "public"."order_headers"("handled_by_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "public"."order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_service_id_idx" ON "public"."order_items"("service_id");

-- CreateIndex
CREATE INDEX "employee_tasks_employee_id_idx" ON "public"."employee_tasks"("employee_id");

-- CreateIndex
CREATE INDEX "employee_tasks_assigned_by_id_idx" ON "public"."employee_tasks"("assigned_by_id");

-- CreateIndex
CREATE INDEX "employee_tasks_order_id_idx" ON "public"."employee_tasks"("order_id");

-- CreateIndex
CREATE INDEX "employee_tasks_outlet_id_idx" ON "public"."employee_tasks"("outlet_id");

-- CreateIndex
CREATE INDEX "employee_tasks_work_station_id_idx" ON "public"."employee_tasks"("work_station_id");

-- AddForeignKey
ALTER TABLE "public"."customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_service_category_id_fkey" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."outlet_schedules" ADD CONSTRAINT "outlet_schedules_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leave_requests" ADD CONSTRAINT "leave_requests_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leave_requests" ADD CONSTRAINT "leave_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_headers" ADD CONSTRAINT "order_headers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_headers" ADD CONSTRAINT "order_headers_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_headers" ADD CONSTRAINT "order_headers_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order_headers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tasks" ADD CONSTRAINT "employee_tasks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tasks" ADD CONSTRAINT "employee_tasks_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tasks" ADD CONSTRAINT "employee_tasks_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order_headers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tasks" ADD CONSTRAINT "employee_tasks_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tasks" ADD CONSTRAINT "employee_tasks_work_station_id_fkey" FOREIGN KEY ("work_station_id") REFERENCES "public"."worker_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
