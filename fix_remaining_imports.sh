#!/bin/bash

echo "Fixing remaining imports..."

# app/institutions/new/page.tsx (button was missing)
sed -i "s|'@/components/ui/button'|'../../../src/components/ui/button'|g" app/institutions/new/page.tsx

# app/institutions/page.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/institutions/page.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/institutions/page.tsx

# app/dashboard/dashboard-client.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/dashboard/dashboard-client.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/dashboard/dashboard-client.tsx
sed -i "s|'@/components/ui/skeleton'|'../../src/components/ui/skeleton'|g" app/dashboard/dashboard-client.tsx

# app/dashboard/optimized-dashboard.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/dashboard/optimized-dashboard.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/dashboard/optimized-dashboard.tsx
sed -i "s|'@/components/ui/skeleton'|'../../src/components/ui/skeleton'|g" app/dashboard/optimized-dashboard.tsx

# app/login/page.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/login/page.tsx
sed -i "s|'@/components/ui/input'|'../../src/components/ui/input'|g" app/login/page.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/login/page.tsx
sed -i "s|'@/components/ui/label'|'../../src/components/ui/label'|g" app/login/page.tsx

echo "All imports fixed!"
