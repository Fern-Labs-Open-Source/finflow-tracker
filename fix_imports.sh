#!/bin/bash

# Fix imports in app directory files
echo "Fixing imports in app directory..."

# app/portfolio/portfolio-client.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/portfolio/portfolio-client.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/portfolio/portfolio-client.tsx
sed -i "s|'@/components/ui/skeleton'|'../../src/components/ui/skeleton'|g" app/portfolio/portfolio-client.tsx

# app/accounts/accounts-client.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/accounts/accounts-client.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/accounts/accounts-client.tsx
sed -i "s|'@/components/ui/input'|'../../src/components/ui/input'|g" app/accounts/accounts-client.tsx
sed -i "s|'@/components/ui/skeleton'|'../../src/components/ui/skeleton'|g" app/accounts/accounts-client.tsx

# app/accounts/new/page.tsx
sed -i "s|'@/components/ui/card'|'../../../src/components/ui/card'|g" app/accounts/new/page.tsx
sed -i "s|'@/components/ui/input'|'../../../src/components/ui/input'|g" app/accounts/new/page.tsx
sed -i "s|'@/components/ui/label'|'../../../src/components/ui/label'|g" app/accounts/new/page.tsx
sed -i "s|'@/components/ui/button'|'../../../src/components/ui/button'|g" app/accounts/new/page.tsx

# app/accounts/optimized-accounts.tsx
sed -i "s|'@/components/ui/card'|'../../src/components/ui/card'|g" app/accounts/optimized-accounts.tsx
sed -i "s|'@/components/ui/button'|'../../src/components/ui/button'|g" app/accounts/optimized-accounts.tsx
sed -i "s|'@/components/ui/input'|'../../src/components/ui/input'|g" app/accounts/optimized-accounts.tsx
sed -i "s|'@/components/ui/skeleton'|'../../src/components/ui/skeleton'|g" app/accounts/optimized-accounts.tsx
sed -i "s|'@/components/ui/virtual-list'|'../../src/components/ui/virtual-list'|g" app/accounts/optimized-accounts.tsx

# app/page.tsx
sed -i "s|'@/components/ui/button'|'../src/components/ui/button'|g" app/page.tsx

# app/institutions/new/page.tsx
sed -i "s|'@/components/ui/card'|'../../../src/components/ui/card'|g" app/institutions/new/page.tsx
sed -i "s|'@/components/ui/input'|'../../../src/components/ui/input'|g" app/institutions/new/page.tsx
sed -i "s|'@/components/ui/label'|'../../../src/components/ui/label'|g" app/institutions/new/page.tsx

echo "Import fixes complete!"
