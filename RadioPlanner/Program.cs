using RadioPlanner.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register in-memory store as singleton so all controllers share the same state
builder.Services.AddSingleton<RadioPlannerStore>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

// Warm up the store on startup (recalculates all link budgets)
_ = app.Services.GetRequiredService<RadioPlannerStore>();

app.Run();
