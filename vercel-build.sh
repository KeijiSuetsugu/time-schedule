#!/bin/bash
set -e

echo "🔧 Starting Vercel build..."

echo "📦 Generating Prisma Client..."
npx prisma generate

if [ "$VERCEL" = "1" ] || [ "$NODE_ENV" = "production" ]; then
  echo "🗄️  Running database migrations..."

  if ! MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1); then
    if echo "$MIGRATE_OUTPUT" | grep -q "P3005" || echo "$MIGRATE_OUTPUT" | grep -q "database schema is not empty"; then
      echo "⚠️  Database already contains data. Applying baseline for existing migrations..."

      mapfile -t migration_dirs < <(find prisma/migrations -maxdepth 1 -mindepth 1 -type d | sort)
      migration_count=${#migration_dirs[@]}

      if [ $migration_count -le 0 ]; then
        echo "⚠️  No migrations found. Skipping migration step..."
      else
        last_index=$((migration_count - 1))

        if [ $last_index -gt 0 ]; then
          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

echo "🏗️  Building Next.js..."
npx next build

echo "✅ Build completed successfully!"


          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

echo "🏗️  Building Next.js..."
npx next build

echo "✅ Build completed successfully!"


          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

          for ((i=0; i<last_index; i++)); do
            migration_dir=${migration_dirs[$i]}
            migration_name=$(basename "$migration_dir")
            echo "🔧 Marking migration as applied (baseline): $migration_name"
            npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
          done
        fi

        last_migration=$(basename "${migration_dirs[$last_index]}")
        echo "🔄 Applying pending migrations starting from: $last_migration"
        if ! npx prisma migrate deploy; then
          echo "⚠️  Migration deploy still failed. Continuing build..."
          echo "$MIGRATE_OUTPUT"
        else
          echo "✅ Pending migrations applied after baseline"
        fi
      fi
    else
      echo "❌ Migration failed with an unexpected error"
      echo "$MIGRATE_OUTPUT"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

echo "🏗️  Building Next.js..."
npx next build

echo "✅ Build completed successfully!"

