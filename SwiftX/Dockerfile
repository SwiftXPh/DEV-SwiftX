# syntax=docker/dockerfile:1

# ---- Build stage: .NET SDK + Node (for the Tailwind CSS build) ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Node is needed because the csproj BuildCss target runs `npx tailwindcss`.
RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Restore .NET dependencies (cached unless the csproj changes).
COPY SwiftX.csproj ./
RUN dotnet restore SwiftX.csproj

# Restore npm dependencies (cached unless the lockfile changes).
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the source and publish. The BuildCss target compiles Tailwind with --minify.
COPY . .
RUN dotnet publish SwiftX.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- Runtime stage: ASP.NET runtime only ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
# Render/Railway inject PORT at runtime; Program.cs binds 0.0.0.0:$PORT.
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SwiftX.dll"]
